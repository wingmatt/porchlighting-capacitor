<template>
  <p v-if="loading">Loading profile...</p>
  <div v-else-if="user" :class="$style.page">
    <div :class="$style.card">
      <h1>{{ profile?.first_name || profile?.email }}</h1>
      <p>{{ profile?.email }}</p>
      <button @click="handleLogout">Log out</button>
    </div>
    <div :class="$style.card">
      <h2>Appearance and Behavior</h2>
      <div :class="$style.preference">
        <ThemeToggle />
        <p>Choose whether Porchlighting uses light or dark colors.</p>
      </div>
      <div :class="$style.preference">
        <label>
          <input type="checkbox" :checked="reducedMotion" @change="handleReducedMotionChange" />
          Reduced motion
        </label>
        <p>Turn off animations and live Porchlight changes so you can refresh manually.</p>
      </div>
      <div :class="$style.preference">
        <label>
          <input type="checkbox" :checked="liveUpdates" @change="handleLiveUpdatesChange" />
          Live updates
        </label>
        <p>Automatically receive Porchlight changes while this app is open.</p>
      </div>
    </div>
    <div :class="$style.card">
      <div :class="$style.sectionHeader">
        <h2>Your porchlights</h2>
        <RouterLink :class="$style.createLink" to="/porchlight/new">New porchlight</RouterLink>
      </div>
      <PorchlightCarousel :porchlights="porchlights" :on-update="updatePorchlight" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import type { Beacon, User } from '../types';
import PorchlightCarousel from '../components/PorchlightCarousel.vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';

const { user, loading, logout } = useAuth();
const router = useRouter();
const profile = ref<User | null>(user.value);
const porchlights = ref<Beacon[]>([]);
const { reducedMotion, liveUpdates, setReducedMotion, setLiveUpdates } = useAccessibilityPreferences();

const loadProfile = () => {
  if (!user.value) return;
  apiClient.get<User>('/auth/me/').then((response) => { profile.value = response.data; });
  apiClient.get<Beacon[]>('/porchlights/').then((response) => { porchlights.value = response.data; });
};

onMounted(loadProfile);
watch(user, loadProfile);
watch([loading, user], ([isLoading, currentUser]) => {
  if (!isLoading && !currentUser) void router.push('/login');
}, { immediate: true });

const handleLogout = async () => {
  await logout();
  await router.push('/');
};

const updatePorchlight = (updated: Beacon) => {
  porchlights.value = porchlights.value.map((porchlight) => porchlight.id === updated.id ? updated : porchlight);
};

const handleReducedMotionChange = (event: Event) => {
  setReducedMotion((event.target as HTMLInputElement).checked);
};

const handleLiveUpdatesChange = (event: Event) => {
  setLiveUpdates((event.target as HTMLInputElement).checked);
};
</script>

<style module src="./ProfilePage.module.css"></style>