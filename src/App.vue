<template>
  <ion-app>
    <ion-menu content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar>
          <ion-title>Porchlighting</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list lines="none">
          <ion-item>
            <router-link to="/neighborhood">Neighborhood</router-link>
          </ion-item>
          <ion-item>
            <router-link to="/moth-mode">Moth Mode</router-link>
          </ion-item>
          <ion-item-divider>
            <ion-label>Account</ion-label>
          </ion-item-divider>
        </ion-list>
        <hr>
        <ion-list lines="none">
          <ion-item>
            <router-link v-if="user" to="/profile">Profile</router-link>
            <router-link v-else-if="route.path !== '/login'" to="/login">Login</router-link>
          </ion-item>
          <ion-item>
            <router-link to="/policies">Policies</router-link>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Open navigation menu" />
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button router-link="/help" fill="clear" aria-label="Help">Help</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-router-outlet id="main-content" />
    <ion-footer>
      <ion-toolbar>

          <ion-buttons>
            <ion-button router-link="/neighborhood" fill="clear" aria-label="Neighborhood">
              <AssetSvg
                asset="neighborhood.svg"
                :label="anyPorchlightOn ? 'Neighborhood, porchlights lit' : 'Neighborhood'"
                :colorVariables="anyPorchlightOn ? { '#neighborhood-base': '--text-color', '#neighborhood-lit': '--active-color' } : { '#neighborhood-base': '--text-color', '#neighborhood-lit': '--text-color' }"
                :style="{ width: '2rem', height: '2rem' }"
              />
              <ion-label>Neighborhood</ion-label>
            </ion-button>
            <notification-settings/>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>
  </ion-app>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { useRoute } from 'vue-router';
import { ThemeProvider } from './contexts/Theme';
import { AccessibilityPreferencesProvider } from './contexts/AccessibilityPreferences';
import { AuthProvider } from './auth';
import NotificationSettings from './components/NotificationSettings.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import AssetSvg from './components/AssetSvg.vue';
import { useNeighborhood } from './hooks/useNeighborhood';

ThemeProvider();
AccessibilityPreferencesProvider();
const { user, loading: authLoading } = AuthProvider();
const route = useRoute();
const { porchlights, refresh } = useNeighborhood();
const anyPorchlightOn = computed(() => porchlights.value.some((porchlight) => porchlight.is_on));

watch([authLoading, user], async ([isLoading]) => {
  if (!isLoading) await refresh(Boolean(user.value));
}, { immediate: true });
</script>