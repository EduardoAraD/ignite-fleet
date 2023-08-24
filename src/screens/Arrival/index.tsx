import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X } from 'phosphor-react-native';
import { BSON } from 'realm';

import { useObject, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { getLastSyncTimestamp } from '../../libs/asyncstorage/syncStorage';

import { Button } from '../../components/Button';
import { ButtonIcon } from '../../components/ButtonIcon';
import { Header } from '../../components/Header';

import { stopLocationTask } from '../../tasks/backgroundLocationTask';

import { Container, Content, Description, Footer, Label, LicensePlate, AsyncMessage } from './styles';

export type RouteParamsProps = {
  id: string;
}

export function Arrival() {
  const { id } = useRoute().params as RouteParamsProps;
  const { goBack } = useNavigation();

  const [dataNotSynced, setDataNotSynced] = useState(false);

  const historic = useObject(Historic, new BSON.UUID(id) as unknown as string);
  const realm = useRealm();

  const title = historic?.status === 'departure' ? 'Chegada' : 'Detalhes';

  function handleRemoveVehicleUsage(){
    Alert.alert(
      'Cancelar',
      'Cancelar a utilização do veículo',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: () => removeVehicleUsage()}
      ]
    )
  }

  function removeVehicleUsage() {
    realm.write(() => {
      realm.delete(historic);
    });
    goBack();
  }

  async function handleArrivalRegister() {
    try {
      if(!historic) {
        return Alert.alert('Error', 'Não fpo possível obter os dados para registrar a chegada do veículo');
      }

      await stopLocationTask();

      realm.write(() => {
        historic.status = 'arrival',
        historic.updated_at = new Date
      });

      Alert.alert('Chegada', 'Chegada registrada com sucesso.')
      goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Não foi possível registrar a chegada do veículo.');
    }
  }

  useEffect(() => {
    getLastSyncTimestamp()
      .then(lastSync => setDataNotSynced(historic!.updated_at.getTime() > lastSync));
  }, [])

  return (
    <Container>
      <Header title={title} />
      <Content>
        <Label>Placa do veículo</Label>
        <LicensePlate>{historic?.license_plate}</LicensePlate>
        
        <Label>Finalidade</Label>
        <Description>
          {historic?.description}
        </Description>
        
      </Content>

      {dataNotSynced && (
        <AsyncMessage>
          Sincronização da {historic?.status === 'departure' ? 'partida' : 'chegada'} pendente.
        </AsyncMessage>
      )}

      {historic?.status === 'departure' && (
        <Footer>
          <ButtonIcon
            icon={X}
            onPress={handleRemoveVehicleUsage}
          />
          <Button
            title='Registar chegada'
            onPress={handleArrivalRegister}
          />
        </Footer>
      )}
    </Container>
  );
}