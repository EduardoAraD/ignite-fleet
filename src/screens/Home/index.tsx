import { useEffect, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useUser } from '@realm/react';
import Toast from 'react-native-toast-message';
import { CloudArrowUp } from 'phosphor-react-native';

import { useQuery, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { getLastSyncTimestamp, saveLastSyncTimestamp } from '../../libs/asyncstorage/syncStorage';

import { CarStatus } from '../../components/CarStatus';
import { HistoricCard, HistoricCardProps } from '../../components/HistoricCard';
import { HomeHeader } from '../../components/HomeHeader';
import { TopMessage } from '../../components/TopMessage';

import { Container, Content, Label, Title } from './styles';

export function Home() {
  const { navigate } = useNavigation();

  const [vehicleUse,setVehicleUse] = useState<Historic | null>(null);
  const [vehicleHistoric, setVehicleHistoric] = useState<HistoricCardProps[]>([]);
  const [percentageToSync, setPercentageToSync] = useState<string | null>(null);

  const historic = useQuery(Historic);
  const realm = useRealm();
  const user = useUser();

  function handleRegisterMovement() {
    if(vehicleUse?._id) {
      navigate('arrival', { id: vehicleUse._id.toString() });
    } else {
      navigate('departure');
    }
  }

  function fecthVehicleInUse() {
    try {
      const vehicle = historic.filtered("status = 'departure'")[0];

      setVehicleUse(vehicle);
    } catch (error) {
      Alert.alert('Veículo em uso', 'Não foi possível carregar o veículo em uso.');
    } 
  }

  async function fecthHistory() {
    try {
      const response = historic.filtered("status = 'arrival' SORT(created_at DESC)");

      const lastSync = await getLastSyncTimestamp();
    
      const formatedHistoric: HistoricCardProps[] = response.map(item => {
        return ({
          id: item._id!.toString(),
          licensePlate: item.license_plate,
          created: dayjs(item.created_at).format('[Saída em] DD/MM/YYYY [ás] HH:mm'),
          isSync: lastSync > item.updated_at!.getTime(),
        })
      });

      setVehicleHistoric(formatedHistoric);
    } catch (error) {
      console.log(error);
      Alert.alert('Histórico', 'Não fpo possível carregar o histórico.')
    }
  }

  function handleHistoricDetails(id: string) {
    navigate('arrival', { id })
  }

  async function progressNotification(transferred: number, transferable: number) {
    const percentage = (transferred/transferable) * 100;

    if(percentage === 100) {
      await saveLastSyncTimestamp();
      await fecthHistory();
      setPercentageToSync(null);

      Toast.show({
        type: 'info',
        text1: 'Todos os dados estão sincronizados.'
      })
    }

    if(percentage < 100) {
      setPercentageToSync(`${percentage.toFixed(0)}% sincronizado.`)
    }
  }

  useEffect(() => {
    fecthVehicleInUse();
  }, []);

  useEffect(() => {
    realm.addListener('change', () => fecthVehicleInUse());

    return () => {
      if(realm && !realm.isClosed) {
        realm.removeListener('change', fecthVehicleInUse);
      }
    };
  }, [])

  useEffect(() => {
    fecthHistory();
  }, [historic]);

  useEffect(() => {
    realm.subscriptions.update((mutableSubs, realm) => {
      const historicByUserQuery = realm.objects('Historic').filtered(`user_id = '${user!.id}'`);

      mutableSubs.add(historicByUserQuery, { name: 'historic_by_user'});
    })
  }, [realm]);

  useEffect(() => {
    const syncSession = realm.syncSession;

    if(!syncSession) {
      return;
    }

    syncSession.addProgressNotification(
      Realm.ProgressDirection.Upload,
      Realm.ProgressMode.ReportIndefinitely,
      progressNotification,
    );

    return () => syncSession.removeProgressNotification(progressNotification);
  }, [])

  return (
    <Container>
      {percentageToSync && <TopMessage title={percentageToSync} icon={CloudArrowUp} />}
      <HomeHeader />

      <Content>
        <CarStatus
          licensePlate={vehicleUse?.license_plate}
          onPress={handleRegisterMovement}
        />

        <Title>Histórico</Title>
        
        <FlatList
          data={vehicleHistoric}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <HistoricCard
              data={item}
              onPress={() => handleHistoricDetails(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={(
            <Label>Nenhum registro de utilização.</Label>
          )}
        />
      </Content>

      
    </Container>
  );
}
