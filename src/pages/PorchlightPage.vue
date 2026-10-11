<template>
  <ion-page>
    <ion-content class="ion-padding">
      <p v-if="loading">Loading porchlight details...</p>
      <p v-else-if="error" :class="styles.error">{{ error }}</p>
      <div v-else-if="beacon" :class="styles.page">
        <div :class="styles.headerCard">
          <div><h2 :class="styles.title">{{ beacon.name || 'Porchlight' }}</h2><p v-if="beacon.status_message" :class="styles.statusMessage">{{ beacon.status_message }}</p><p v-if="beacon.description" :class="styles.description">{{ beacon.description }}</p><p v-if="canEdit && beacon.active_until" :class="styles.expiry">{{ expiryLabel }}</p></div>
          <div :class="styles.headerActions">
            <ion-button v-if="canEdit" fill="outline" :router-link="`/porchlight/${beacon.sqid}/edit`">Edit</ion-button>
            <label v-if="canEdit && hasClosePermission" :class="styles.brightnessControl">Bright <ion-range v-model="brightness" :class="styles.brightnessSlider" :disabled="savingBrightness" :min="0" :max="100" :step="100" :snaps="true" :ticks="true" aria-label="Brightness" @ion-change="updateBrightness" /> Dim</label>
            <beacon-icon :beacon="beacon" :editable="canEdit" @update="mergeBeacon" />
          </div>
        </div>
        <div v-if="beacon.location" :class="styles.sectionCard"><h3 :class="styles.sectionTitle">Location Map</h3><mapbox-map :location="beacon.location" :name="beacon.name" :status-message="beacon.status_message" :is-on="beacon.is_on" :color="beacon.color || '#F59E0B'" :class-name="styles.map" /></div>
        <div v-if="canManageInvitations" :class="styles.invitationCard">
          <h3 :class="styles.sectionTitle">Invitation</h3><p v-if="invitationError" :class="styles.invitationError">{{ invitationError }}</p>
          <template v-if="defaultInvitation">
            <div :class="styles.invitationItem"><span>View · {{ defaultInvitation.accepted_count ?? 0 }} accepted</span><a :href="`/join/${defaultInvitation.sqid || defaultInvitation.code}`">/join/{{ defaultInvitation.sqid || defaultInvitation.code }}</a></div>
            <ion-button expand="block" :class="styles.invitationButton" @click="copyInvitationLink">Copy invitation link</ion-button>
            <p v-if="copyStatus" :class="styles.copyStatus">{{ copyStatus }}</p>
            <div v-if="qrCode" :class="styles.qrCode"><img :src="qrCode" alt="QR code for the invitation link"><span>Scan to open the invitation</span></div>
          </template>
          <h4 :class="styles.accessTitle">People with access</h4><p v-if="accessError">{{ accessError }}</p><ul :class="styles.invitationList"><li v-for="entry in access" :key="`${entry.type}-${entry.id}`" :class="styles.accessItem"><span>{{ entry.name || entry.email || 'Guest' }} · {{ entry.role }}</span><ion-button v-if="entry.editable" fill="clear" @click="editingAccess = entry">Edit access</ion-button></li></ul>
        </div>
        <rsvp :beacon="beacon" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { IonButton, IonContent, IonPage, IonRange } from '@ionic/vue';
import { useRoute } from 'vue-router';
import QRCode from 'qrcode';
import { apiClient } from '../api/client';
import type { Beacon, Invitation, PorchlightAccess } from '../types';
import BeaconIcon from '../components/BeaconIcon.vue';
import MapboxMap from '../components/MapboxMap.vue';
import Rsvp from '../components/Rsvp.vue';
import { useFirebaseBeacon } from '../hooks/useFirebaseBeacon';
import styles from './PorchlightPage.module.css';
const route = useRoute();
const initialBeacon = ref<Beacon | null>(null);
const { beacon } = useFirebaseBeacon(initialBeacon);
const loading = ref(true);
const error = ref('');
const invitations = ref<Invitation[]>([]);
const access = ref<PorchlightAccess[]>([]);
const invitationError = ref('');
const accessError = ref('');
const copyStatus = ref('');
const qrCode = ref('');
const savingBrightness = ref(false);
const editingAccess = ref<PorchlightAccess | null>(null);
const canEdit = computed(() => Boolean(beacon.value?.is_owner || ['OWNER', 'EDIT'].includes(beacon.value?.user_role || '')));
const canManageInvitations = computed(() => canEdit.value);
const defaultInvitation = computed(() => invitations.value.find((invitation) => (
  invitation.is_guest === false && invitation.role_granted === 'view' && invitation.max_uses === 0
)) || invitations.value.find((invitation) => invitation.is_guest === false));
const invitationLink = computed(() => defaultInvitation.value?.sqid ? `${window.location.origin}/join/${defaultInvitation.value.sqid}` : '');
const expiryLabel = computed(() => {
  if (!beacon.value?.active_until) return '';
  const expiry = new Date(beacon.value.active_until);
  return `Expires ${expiry <= new Date() ? 'at' : 'on'} ${expiry.toLocaleString()}`;
});
const hasClosePermission = computed(() => (
  access.value.some((entry) => entry.is_close) || beacon.value?.has_close_permission === true
));
const brightness = computed({
  get: () => beacon.value?.brightness ?? 100,
  set: (value) => {
    if (beacon.value) beacon.value.brightness = Number(value);
  },
});

const mergeBeacon = (updated: Beacon) => {
  if (beacon.value) beacon.value = { ...beacon.value, ...updated };
};

const load = async () => {
  loading.value = true;

  try {
    const response = await apiClient.get(`/porchlights/${String(route.params.id)}/`);
    initialBeacon.value = response.data;
    error.value = '';
  } catch (requestError: any) {
    error.value = requestError?.response?.data?.detail || 'Failed to load porchlight';
  } finally {
    loading.value = false;
  }
};
const loadAccess = async () => { if (!beacon.value?.sqid || !canManageInvitations.value) return; try { const [invites, accessResponse] = await Promise.all([apiClient.get('/invitations/', { params: { porchlight: beacon.value.id } }), apiClient.get(`/porchlights/${beacon.value.sqid}/access/`)]); invitations.value = invites.data; access.value = accessResponse.data.access || []; invitationError.value = ''; } catch { invitationError.value = 'Unable to load porchlight invitations.'; accessError.value = 'Unable to load porchlight access.'; } };
watch(invitationLink, (link) => { if (!link) { qrCode.value = ''; return; } QRCode.toDataURL(link, { width: 220, margin: 1 }).then((url) => { qrCode.value = url; }).catch(() => { qrCode.value = ''; }); });
const copyInvitationLink = async () => { try { await navigator.clipboard.writeText(invitationLink.value); copyStatus.value = 'Invitation link copied.'; } catch { copyStatus.value = 'Unable to copy the invitation link.'; } };
const updateBrightness = async () => { if (!canEdit.value || !beacon.value?.sqid) return; savingBrightness.value = true; try { const response = await apiClient.post(`/porchlights/${beacon.value.sqid}/control/`, { brightness: brightness.value }); if (response.data?.porchlight) mergeBeacon(response.data.porchlight); } finally { savingBrightness.value = false; } };
onMounted(async () => { await load(); await loadAccess(); });
watch(() => route.params.id, load);
</script>