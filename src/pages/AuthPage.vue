<template>
  <ion-page>
    <ion-content>
      <div v-if="isMagicConfirm" class="page">
        <div class="card">
          <h1>Signing you in...</h1>
          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>
      <div v-else-if="isEmailConfirm" class="page">
        <div class="card"><h1>Confirming your email...</h1></div>
      </div>
      <div v-else class="page">
        <div class="card">
          <h1>{{ title }}</h1>
          <p v-if="message" class="success">{{ message }}</p>
          <p v-if="error" class="error">{{ error }}</p>
          <form v-if="!message || isLogin" @submit.prevent="submit">
            <label v-if="!isReset">Email<ion-input v-model="email" type="email" required /></label>
            <label v-if="isRegister">Name<ion-input v-model="name" /></label>
            <label v-if="isLogin || isRegister || isReset">Password<ion-input v-model="password" type="password" required minlength="6" /></label>
            <label v-if="isRegister || isReset">Confirm password<ion-input v-model="passwordConfirm" type="password" required minlength="6" /></label>
            <ion-button type="submit" expand="block">{{ submitLabel }}</ion-button>
          </form>
          <nav class="links">
            <router-link v-if="isLogin" to="/register">Create an account</router-link>
            <router-link v-if="isLogin" to="/forgot-password">Forgot password?</router-link>
            <router-link v-if="isLogin" to="/magic-login">Use a magic link</router-link>
            <router-link v-if="isRegister" to="/login">Already have an account?</router-link>
            <router-link v-if="!isLogin && !isRegister" to="/login">Back to log in</router-link>
          </nav>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButton, IonContent, IonInput, IonPage } from '@ionic/vue';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'magic-login' | 'confirm-email';

const props = defineProps<{ mode: AuthMode }>();
const route = useRoute();
const router = useRouter();
const { login, loginWithToken } = useAuth();
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const name = ref('');
const message = ref('');
const error = ref('');

const uid = computed(() => String(route.params.uid || ''));
const token = computed(() => String(route.params.token || ''));
const isReset = computed(() => props.mode === 'forgot-password' && Boolean(uid.value && token.value));
const isMagicConfirm = computed(() => props.mode === 'magic-login' && Boolean(uid.value && token.value));
const isEmailConfirm = computed(() => props.mode === 'confirm-email' && Boolean(uid.value && token.value));
const isLogin = computed(() => props.mode === 'login');
const isRegister = computed(() => props.mode === 'register');
const title = computed(() => isLogin.value ? 'Log in' : isRegister.value ? 'Create your account' : isReset.value ? 'Choose a new password' : props.mode === 'magic-login' ? 'Email me a login link' : 'Reset your password');
const submitLabel = computed(() => isLogin.value ? 'Log in' : isRegister.value ? 'Register' : isReset.value ? 'Set password' : 'Send link');

const resetForm = () => {
  email.value = '';
  password.value = '';
  passwordConfirm.value = '';
  name.value = '';
  const state = window.history.state as { message?: string; error?: string } | null;
  message.value = state?.message || '';
  error.value = state?.error || '';
};

watch(() => [props.mode, uid.value, token.value], resetForm, { immediate: true });

onMounted(() => {
  if (isEmailConfirm.value) {
    apiClient.get(`/auth/confirm-email/${uid.value}/${token.value}/`).then((response) => {
      router.replace({ path: '/login', state: { message: response.data.message } });
    }).catch((requestError: any) => {
      router.replace({ path: '/login', state: { error: requestError?.response?.data?.error || 'This email confirmation link is invalid or has expired.' } });
    });
  }
  if (isMagicConfirm.value) {
    apiClient.get(`/auth/magic-login/${uid.value}/${token.value}/`).then(async (response) => {
      await loginWithToken(response.data.token, response.data.user);
      await router.push('/profile');
    }).catch((requestError: any) => { error.value = requestError?.response?.data?.error || 'This magic login link is invalid or has expired.'; });
  }
});

const submit = async () => {
  error.value = '';
  message.value = '';
  try {
    if (isLogin.value) { await login(email.value, password.value); await router.push('/profile'); return; }
    if (isRegister.value) {
      const response = await apiClient.post('/auth/register/', { email: email.value, password: password.value, password_confirm: passwordConfirm.value, first_name: name.value });
      message.value = response.data.message;
      return;
    }
    if (isReset.value) {
      const response = await apiClient.post(`/auth/password-reset/${uid.value}/${token.value}/`, { password: password.value, password_confirm: passwordConfirm.value });
      message.value = response.data.message;
      return;
    }
    const endpoint = props.mode === 'magic-login' ? '/auth/magic-login/' : '/auth/password-reset/';
    const response = await apiClient.post(endpoint, { email: email.value });
    message.value = response.data.message;
  } catch (requestError: any) {
    const data = requestError?.response?.data;
    error.value = data?.detail || data?.error || data?.password?.[0] || data?.password_confirm?.[0] || 'Something went wrong.';
  }
};
</script>

<style src="./AuthPage.module.css"></style>