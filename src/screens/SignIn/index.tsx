import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Realm, useApp } from '@realm/react';

import { ANDROID_CLIENT_ID, IOS_CLIENT_ID } from '@env';

import { Button } from '../../components/Button';

import { Container, Slogan, Title } from './styles';
import backgroundImg from '../../assets/background.png';

WebBrowser.maybeCompleteAuthSession();

export function SignIn() {
  const app = useApp();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [_, response, googleSignIn] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  })

  function handleGoogleSignIn() {
    setIsAuthenticating(true);

    googleSignIn().then((response) => {
      if(response.type !== 'success') {
        setIsAuthenticating(false);
      }
    })
  }

  useEffect(() => {
    if(response?.type === 'success'){
      if(response.authentication?.idToken){
        // pegar os dados do usuario do token =>
        // fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${response.authentication?.idToken}`)
        //   .then(response => response.json())
        //   .then(console.log);


        const credentials = Realm.Credentials.jwt(response.authentication.idToken);
        app.logIn(credentials).catch((error) => {
          console.log(error);
          Alert.alert('Entrar', 'Não foi possível conectar-se a sua conta google.')
          setIsAuthenticating(false);
        });
      } else {
        Alert.alert('Entrar', 'Não foi possível conectar-se a sua conta google.')
        setIsAuthenticating(false);
      }
    }
  }, [response]);

  return (
    <Container source={backgroundImg}>
      <Title>Ignite Fleet</Title>
      <Slogan>Gestão de uso de veículos</Slogan>
      <Button
        title='Entrar com Google'
        isLoading={isAuthenticating}
        onPress={handleGoogleSignIn}
      />
    </Container>
  );
}

