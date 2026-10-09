<template>
  <ion-button fill="clear" :aria-label="`Switch to ${nextTheme} mode`" :aria-pressed="theme === 'dark'" @click="toggleTheme">
    <span aria-hidden="true">{{ nextTheme === 'light' ? '☀' : '☾' }}</span>
    <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
  </ion-button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonButton } from '@ionic/vue';
import { useTheme } from '../contexts/Theme';

const { theme, toggleTheme } = useTheme();
const nextTheme = computed(() => theme.value === 'dark' ? 'light' : 'dark');
</script>