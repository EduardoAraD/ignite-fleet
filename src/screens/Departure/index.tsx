import { useRef, useState } from 'react';
import { Alert, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@realm/react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';

import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { LicensePlateinput } from '../../components/LicensePlateinput';
import { TextAreaInput } from '../../components/TextAreaInput';

import { licensePlateValidade } from '../../utils/licensePlateValidade';

import { Container, Content } from './styles';

export function Departure() {
  const user = useUser();
  const { goBack } = useNavigation();

  const [description, setDescription] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const descriptionRef = useRef<TextInput>(null);
  const licensePlateRef = useRef<TextInput>(null);

  const realm = useRealm();

  function handleDepartureRegister() {
    try {
      if(!licensePlateValidade(licensePlate)) {
        licensePlateRef.current?.focus();
        return Alert.alert("Placa inválida", "A placa é inválida. Por favor, informe a placa correta do veículo.")
      }
  
      if(description.trim().length === 0) {
        descriptionRef.current?.focus();
        return Alert.alert('Finalidade', 'Por favor, informe a finalidade da utilização do veículo.');
      }

      setIsRegistering(true);

      realm.write(() => {
        realm.create('Historic', Historic.generate({
          description,
          license_plate: licensePlate.toUpperCase(),
          user_id: user.id,
        }))
      });

      Alert.alert('Saída', 'Saída do veículo registrada com sucesso.');
      goBack();

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível registrar a saída do veículo');
    } finally {
      setIsRegistering(false);
    }
    
  }

  return (
    <Container>
      <Header title='Saída' />

      <KeyboardAwareScrollView extraHeight={100}>
        <ScrollView>
          <Content>
            <LicensePlateinput
              ref={licensePlateRef}
              label='Placa do veículo'
              placeholder='BRA1234'
              onSubmitEditing={() => descriptionRef.current?.focus()}
              returnKeyType='next'
              onChangeText={setLicensePlate}
            />

            <TextAreaInput
              ref={descriptionRef}
              label='Finalidade'
              placeholder='Vou utilizar o veículo para ...'
              onChangeText={setDescription}
              onSubmitEditing={handleDepartureRegister}
              returnKeyType='send'
              blurOnSubmit
            />

            <Button
              title='Registrar Saída'
              onPress={handleDepartureRegister}
              isLoading={isRegistering}
            />
          </Content>
        </ScrollView>
      </KeyboardAwareScrollView>
    </Container>
  );
}
