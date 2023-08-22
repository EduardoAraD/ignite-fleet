import { useEffect, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { useQuery, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';

import { CarStatus } from '../../components/CarStatus';
import { HistoricCard, HistoricCardProps } from '../../components/HistoricCard';
import { HomeHeader } from '../../components/HomeHeader';

import { Container, Content, Label, Title } from './styles';

export function Home() {
  const { navigate } = useNavigation();

  const [vehicleUse,setVehicleUse] = useState<Historic | null>(null);
  const [vehicleHistoric, setVehicleHistoric] = useState<HistoricCardProps[]>([]);

  const historic = useQuery(Historic);
  const realm = useRealm();

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

  function fecthHistory() {
    try {
      const response = historic.filtered("status = 'arrival' SORT(created_at DESC)");
    
      const formatedHistoric: HistoricCardProps[] = response.map(item => {
        return ({
          id: item._id!.toString(),
          licensePlate: item.license_plate,
          created: dayjs(item.created_at).format('[Saída em] DD/MM/YYYY [ás] HH:mm'),
          isSync: false,
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
  }, [historic])

  return (
    <Container>
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
