// utils/useGoogleAuth.js

import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import { ANDROID_ID } from "@env";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: ANDROID_ID,
    scopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  console.log("🔁 Redirect URI:", AuthSession.makeRedirectUri({ useProxy: true }));


  useEffect(() => {
    const checkStoredToken = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        setAccessToken(token);
      }
    };
    checkStoredToken();
  }, []);

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success") {
        const token = response.authentication.accessToken;
        setAccessToken(token);
        await SecureStore.setItemAsync("accessToken", token);
      }
    };
    handleResponse();
  }, [response]);

  return {
    accessToken,
    promptAsync,
    isRequestReady: !!request,
  };
}
