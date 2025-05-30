import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useOptimisticMutation = (key = "@cachedLeads", onUpdateContext = () => {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const getCache = async () => {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  };

  const setCache = async (data) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    onUpdateContext(data); // refresh any local UI states
  };

  const add = async (newItem, serverFn) => {
    const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticItem = { ...newItem, id, synced: false, isOptimistic: true };

    setIsProcessing(true);
    const cached = await getCache();
    const updatedCache = [optimisticItem, ...cached];
    await setCache(updatedCache);

    try {
      const res = await serverFn(optimisticItem);
      if (!res.ok) throw new Error("Server rejected the item");
      const realItem = await res.json();

      const reconciled = updatedCache.map((item) =>
        item.id === id ? { ...realItem, synced: true, isOptimistic: false } : item
      );
      await setCache(reconciled);
    } catch (err) {
      console.error("❌ Optimistic add failed", err);
      // Optionally log error or retry
    } finally {
      setIsProcessing(false);
    }
  };

  const edit = async (itemId, updatedFields, serverFn) => {
    setIsProcessing(true);
    const cached = await getCache();
    const updatedCache = cached.map((item) =>
      item.id === itemId ? { ...item, ...updatedFields, synced: false } : item
    );
    await setCache(updatedCache);

    try {
      const res = await serverFn(itemId, updatedFields);
      if (!res.ok) throw new Error("Server rejected the update");
      const realItem = await res.json();

      const reconciled = updatedCache.map((item) =>
        item.id === itemId ? { ...realItem, synced: true } : item
      );
      await setCache(reconciled);
    } catch (err) {
      console.error("❌ Optimistic edit failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const remove = async (itemId, serverFn) => {
    setIsProcessing(true);
    const cached = await getCache();
    const filtered = cached.filter((item) => item.id !== itemId);
    await setCache(filtered);

    try {
      const res = await serverFn(itemId);
      if (!res.ok) throw new Error("Server failed to delete");
    } catch (err) {
      console.error("❌ Optimistic delete failed", err);
      // Optionally restore item in cache if delete failed
      await setCache(cached);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    add,
    edit,
    remove,
    isProcessing,
  };
};
