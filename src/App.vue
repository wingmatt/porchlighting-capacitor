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
          <ion-item router-link="/neighborhood" detail="false">
            <ion-label>Neighborhood</ion-label>
          </ion-item>
          <ion-item v-if="user" router-link="/profile" detail="false">
            <ion-label>Profile</ion-label>
          </ion-item>
          <ion-item v-else-if="route.path !== '/login'" router-link="/login" detail="false">
            <ion-label>Log in</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Open navigation menu" />
        </ion-buttons>
        <ion-title><router-link to="/">Porchlighting</router-link></ion-title>
        <ion-buttons slot="end">
          <notification-settings />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-router-outlet id="main-content" />
    <ion-footer>
      <ion-toolbar>
        <ion-title size="small">© 2026 Porchlighting · <router-link to="/policies">Policies</router-link></ion-title>
      </ion-toolbar>
    </ion-footer>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
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

ThemeProvider();
AccessibilityPreferencesProvider();
const { user } = AuthProvider();
const route = useRoute();
</script>