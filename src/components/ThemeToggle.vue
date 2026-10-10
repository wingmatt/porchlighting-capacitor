<template>
  <ion-button fill="clear" :aria-label="`Switch to ${nextTheme} mode`" :aria-pressed="theme === 'dark'" @click="toggleTheme">
    <AssetSvg className="theme-icon" :asset=toggleIcon :style="{marginRight: '.33em', width: '1.33em'}"/>
    <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
  </ion-button>
</template>

<script setup lang="ts">
import {computed, ComputedRef} from 'vue';
import { IonButton } from '@ionic/vue';
import { useTheme } from '../contexts/Theme';
import AssetSvg from "./AssetSvg.vue";

const { theme, toggleTheme } = useTheme();
const nextTheme: ComputedRef<string> = computed(() => theme.value === 'dark' ? 'light' : 'dark');
const toggleIcon: ComputedRef<string> = computed(() => theme.value === 'dark' ? 'sun.svg' : 'moon.svg');
</script>

<style module src="./ThemeToggle.module.css" ></style>