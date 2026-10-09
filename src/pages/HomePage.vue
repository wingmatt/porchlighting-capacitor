<template>
  <ion-page>
    <ion-content class="ion-padding">
      <p v-if="authLoading || loading">Loading porchlights...</p>
      <p v-else-if="error" role="alert">{{ error }}</p>
      <div v-else :class="styles.homeStack">
        <section v-if="!user && !guestReady" :class="styles.card">
          <h1>Welcome to Porchlighting</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor.</p>
          <div :class="styles.actions"><ion-button router-link="/login">Log in</ion-button><ion-button fill="outline" router-link="/register">Sign up</ion-button></div>
        </section>
        <section v-else-if="!user" :class="styles.card">
          <h1>Hello, {{ guestName || 'guest' }}!</h1>
          <h2>{{ litCount }} lit porchlights</h2>
          <porchlight-list :porchlights="accessiblePorchlights" @update="updatePorchlight" />
        </section>
        <template v-else>
          <section :class="styles.card"><porchlight-carousel :porchlights="editablePorchlights" @update="updatePorchlight" /></section>
          <section :class="styles.card"><h2>{{ litCount }} lit porchlights</h2><porchlight-list :porchlights="accessiblePorchlights" @update="updatePorchlight" /></section>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { IonButton, IonContent, IonPage } from '@ionic/vue';
import { Preferences } from '@capacitor/preferences';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import type { Beacon } from '../types';
import PorchlightCarousel from '../components/PorchlightCarousel.vue';
import PorchlightList from '../components/PorchlightList.vue';
import styles from './HomePage.module.css';

const editableRoles = new Set(['OWNER', 'ADMIN', 'EDIT', 'SHARE']);
const { user, loading: authLoading } = useAuth();
const guestName = ref('');
const guestReady = ref(false);
const accessiblePorchlights = ref<Beacon[]>([]);
const editablePorchlights = ref<Beacon[]>([]);
const loading = ref(true);
const error = ref('');
const litCount = computed(() => accessiblePorchlights.value.filter((porchlight) => porchlight.is_on).length);

const updatePorchlight = (updated: Beacon) => {
  accessiblePorchlights.value = accessiblePorchlights.value.map((item) => item.id === updated.id ? updated : item);
  editablePorchlights.value = editablePorchlights.value.map((item) => item.id === updated.id ? updated : item);
};

const loadHome = async () => {
  if (authLoading.value) return;
  loading.value = true;
  error.value = '';
  const [{ value: token }, { value: name }] = await Promise.all([Preferences.get({ key: 'guestToken' }), Preferences.get({ key: 'guestName' })]);
  guestName.value = name || '';
  guestReady.value = !user.value && Boolean(token);
  if (!user.value && !token) { accessiblePorchlights.value = []; editablePorchlights.value = []; loading.value = false; return; }
  try {
    const accessibleRequest = apiClient.get('/neighborhood/');
    const responses = user.value ? await Promise.all([accessibleRequest, apiClient.get('/porchlights/')]) : [await accessibleRequest];
    accessiblePorchlights.value = responses[0].data as Beacon[];
    editablePorchlights.value = user.value ? (responses[1].data as Beacon[]).filter((item) => item.is_owner || editableRoles.has(String(item.user_role || '').toUpperCase())) : [];
  } catch { error.value = 'Unable to load your porchlights right now.'; }
  finally { loading.value = false; }
};
onMounted(loadHome);
watch([authLoading, user], loadHome);
</script>