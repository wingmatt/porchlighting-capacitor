import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('./pages/AuthPage.vue'), props: { mode: 'login' } },
  { path: '/register', component: () => import('./pages/AuthPage.vue'), props: { mode: 'register' } },
  { path: '/forgot-password', component: () => import('./pages/AuthPage.vue'), props: { mode: 'forgot-password' } },
  { path: '/forgot-password/:uid/:token/', component: () => import('./pages/AuthPage.vue'), props: { mode: 'forgot-password' } },
  { path: '/magic-login', component: () => import('./pages/AuthPage.vue'), props: { mode: 'magic-login' } },
  { path: '/magic-login/:uid/:token/', component: () => import('./pages/AuthPage.vue'), props: { mode: 'magic-login' } },
  { path: '/confirm-email/:uid/:token/', component: () => import('./pages/AuthPage.vue'), props: { mode: 'confirm-email' } },
  { path: '/profile', component: () => import('./pages/ProfilePage.vue') },
  { path: '/porchlight/new', component: () => import('./pages/PorchlightCreatePage.vue') },
  { path: '/porchlight/:id/edit', component: () => import('./pages/PorchlightEditPage.vue') },
  { path: '/join/:sqid', component: () => import('./pages/InvitationPage.vue') },
  { path: '/porchlight/:id', component: () => import('./pages/PorchlightPage.vue') },
  { path: '/policies', component: () => import('./pages/PoliciesPage.vue') },
  { path: '/moth-mode', component: () => import('./pages/MothModePage.vue') },
  { path: '/help', component: () => import('./pages/HelpPage.vue') },
  { path: '/', component: () => import('./pages/HomePage.vue') },
  { path: '/neighborhood', component: () => import('./pages/HomePage.vue') },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});