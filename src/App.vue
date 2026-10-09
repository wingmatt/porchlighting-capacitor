<template>
  <ion-app>
    <ion-header>
      <ion-toolbar>
        <ion-title><router-link to="/">Porchlighting</router-link></ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/neighborhood">Neighborhood</ion-button>
          <ion-button v-if="user" router-link="/profile">Profile</ion-button>
          <ion-button v-else-if="route.path !== '/login'" router-link="/login">Log in</ion-button>
          <theme-toggle />
          <notification-settings />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-router-outlet />
    <ion-footer>
      <ion-toolbar>
        <ion-title size="small">© 2026 Porchlighting · <router-link to="/policies">Policies</router-link></ion-title>
      </ion-toolbar>
    </ion-footer>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonButton, IonButtons, IonFooter, IonHeader, IonRouterOutlet, IonTitle, IonToolbar } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { ThemeProvider } from './contexts/Theme';
import { AccessibilityPreferencesProvider } from './contexts/AccessibilityPreferences';
import { AuthProvider, useAuth } from './auth';
import NotificationSettings from './components/NotificationSettings.vue';
import ThemeToggle from './components/ThemeToggle.vue';

ThemeProvider();
AccessibilityPreferencesProvider();
AuthProvider();
const route = useRoute();
const { user } = useAuth();
</script>