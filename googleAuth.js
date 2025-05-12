import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = '633200936973-9nad9lk5vtb1ao69cs51iomkss8ae1e5.apps.googleusercontent.com';
const REDIRECT_URI = 'https://auth.expo.io/@lenaray/AuthApp';
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export async function signInWithGoogleAsync() {
  try {
    const authRequest = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
    });

    await authRequest.makeAuthUrlAsync(discovery);

    const result = await authRequest.promptAsync(discovery, { useProxy: true });

    if (result.type !== 'success') {
      throw new Error('Authentication failed');
    }

    // Exchange code for token
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        code: result.params.code,
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        extraParams: {
          code_verifier: authRequest.codeVerifier,
        },
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
