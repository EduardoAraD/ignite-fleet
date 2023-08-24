import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X } from 'phosphor-react-native';
import { BSON } from 'realm';
import { LatLng } from 'react-native-maps';
import dayjs from 'dayjs';

import { useObject, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { getLastSyncTimestamp } from '../../libs/asyncstorage/syncStorage';
import { getStorageLocation } from '../../libs/asyncstorage/locationStorage';

import { Button } from '../../components/Button';
import { ButtonIcon } from '../../components/ButtonIcon';
import { Header } from '../../components/Header';
import { Locations } from '../../components/Locations';
import { Map } from '../../components/Map';

import { stopLocationTask } from '../../tasks/backgroundLocationTask';

import { Container, Content, Description, Footer, Label, LicensePlate, AsyncMessage } from './styles';
import { getAddressLocation } from '../../utils/getAdressLocation';
import { LocationInfoProps } from '../../components/LocationInfo';
import { Loading } from '../../components/Loading';

export type RouteParamsProps = {
  id: string;
}

export function Arrival() {
  const { id } = useRoute().params as RouteParamsProps;
  const { goBack } = useNavigation();

  const [dataNotSynced, setDataNotSynced] = useState(false);
  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const [departure, setDeparture] = useState<LocationInfoProps>({} as LocationInfoProps);
  const [arrival, setArrival] = useState<LocationInfoProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  async function removeVehicleUsage() {
    realm.write(() => {
      realm.delete(historic);
    });

    await stopLocationTask();
    goBack();
  }

  async function handleArrivalRegister() {
    try {
      if(!historic) {
        return Alert.alert('Error', 'Não fpo possível obter os dados para registrar a chegada do veículo');
      }

      const locations = await getStorageLocation();

      realm.write(() => {
        historic.status = 'arrival';
        historic.updated_at = new Date();
        historic.coords.push(...locations);
      });

      await stopLocationTask();

      Alert.alert('Chegada', 'Chegada registrada com sucesso.')
      goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Não foi possível registrar a chegada do veículo.');
    }
  }

  async function getLocationsInfo() {
    if(!historic) {
      return ;
    }
    const lastSync = await getLastSyncTimestamp();
    const updatedAt = historic!.updated_at.getTime();

    setDataNotSynced(updatedAt > lastSync);

    if(historic?.status === 'departure') {
      const locationsStorage = await getStorageLocation();
      setCoordinates(locationsStorage);
    } else {
      const coordsTest = historic?.coords ?? [];
      setCoordinates(coordsTest.map(item => ({
        latitude: Number(item.latitude.toFixed(5)),
        longitude: Number(item.longitude.toFixed(5))
      })));
    }
    if(historic?.coords[0]) {
      const departureStreetName = await getAddressLocation(historic.coords[0]);
      setDeparture({
        label: `Saindo em ${departureStreetName ?? ''}`,
        description: dayjs(new Date(historic.coords[0].timestamp)).format('DD/MM/YYYY [ás] HH:mm')
      });
    }

    if(historic?.status === 'arrival' && historic?.coords) {
      const lastlocation = historic.coords[historic.coords.length - 1];
      const arrivalStreetName = await getAddressLocation(lastlocation);

      setArrival({
        label: `Chegando em ${arrivalStreetName ?? ''}`,
        description: dayjs(new Date(lastlocation.timestamp)).format('DD/MM/YYYY [ás] HH:mm'),
      });
    }


    setIsLoading(false);
  }

  useEffect(() => {
    getLocationsInfo();
  }, [historic]);

  if(isLoading) {
    return (
      <Container>
        <Header title={title} />
        <Loading />
      </Container>
    )
  }

  return (
    <Container>
      <Header title={title} />
      {coordinates.length > 0 && (
        <Map
          coordinates={coordinates}
        />
      )}
      <Content>
        <Locations
          departure={departure}
          arrival={arrival}
        />

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
