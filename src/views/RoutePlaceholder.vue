<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h1>{{ title }}</h1>
      <p>This view is being migrated to Ionic Vue.</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';

defineProps<{ title: string }>();
</script>