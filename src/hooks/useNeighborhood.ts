import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { apiClient } from '../api/client';
import type { Beacon } from '../types';

const porchlights = ref<Beacon[]>([]);
const loading = ref(false);

export const useNeighborhood = () => {
  const setPorchlights = (value: Beacon[]) => {
    porchlights.value = value;
  };

  const refresh = async (userIsAuthenticated: boolean) => {
    const { value: guestToken } = await Preferences.get({ key: 'guestToken' });
    if (!userIsAuthenticated && !guestToken) {
      setPorchlights([]);
      return;
    }

    loading.value = true;
    try {
      setPorchlights((await apiClient.get<Beacon[]>('/neighborhood/')).data);
    } catch {
      setPorchlights([]);
    } finally {
      loading.value = false;
    }
  };

  return { porchlights, loading, refresh, setPorchlights };
};