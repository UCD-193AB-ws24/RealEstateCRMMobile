import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY = 'PENDING_UPDATES';

export const savePendingUpdate = async (update) => {
  const existing = JSON.parse(await AsyncStorage.getItem(PENDING_KEY)) || [];
  existing.push(update);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(existing));
};

export const trySyncUpdates = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const updates = JSON.parse(await AsyncStorage.getItem(PENDING_KEY)) || [];
  const remaining = [];

  for (const update of updates) {
    try {
      const res = await fetch(update.url, {
        method: update.method,
        headers: update.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(update.body),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
    } catch (e) {
      console.log('❌ Sync error:', e.message);
      remaining.push(update); // keep failed one
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } else {
    await AsyncStorage.removeItem(PENDING_KEY);
  }
};
