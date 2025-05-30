import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';

import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { IOS_ID, ANDROID_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState(null);

  const redirectUri = makeRedirectUri({
    scheme: 'com.googleusercontent.apps.633200936973-jb6u8rpfchv0qee43isokonncon5ckjp',
  });
  

  console.log(redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_ID,
    androidClientId: ANDROID_ID,
    scopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/spreadsheets"

    ],
    redirectUri: redirectUri,
  });

  console.log(response);

  useEffect(() => {
    const fetchUserInfo = async (token) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userInfo = await res.json();

        if (userInfo && userInfo.email) {
          await SecureStore.setItemAsync("user", JSON.stringify({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }));
        }

      } catch (err) {
        console.error("Error fetching or storing user info", err);
      }
    };

    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        setAccessToken(authentication.accessToken);
        SecureStore.setItemAsync("accessToken", authentication.accessToken);
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  return { accessToken, promptAsync, isRequestReady: !!request };

}
