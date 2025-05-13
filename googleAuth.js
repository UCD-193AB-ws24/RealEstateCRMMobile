import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { CLIENT_ID } from '@env';
import { REDIRECT_URI } from '@env';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export async function signInWithGoogleAsync() {
  try {
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
      redirectUri: REDIRECT_URI,
      usePKCE: true,
    });

    const result = await request.promptAsync(discovery, { useProxy: true });

    if (result.type !== 'success') {
      throw new Error('Authentication failed');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        code: result.params.code,
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        codeVerifier: request.codeVerifier,
      },
      discovery
    );

    if (!tokenResponse.accessToken) {
      throw new Error('No access token received');
    }

    await SecureStore.setItemAsync('accessToken', tokenResponse.accessToken);
    return tokenResponse.accessToken;
  } catch (e) {
    console.error('❌ Google login failed:', e);
    throw e;
  }
}
