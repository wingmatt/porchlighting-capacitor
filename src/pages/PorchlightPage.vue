<template>
  <ion-page>
    <ion-content class="ion-padding">
      <p v-if="loading">Loading porchlight details...</p>
      <p v-else-if="error" :class="styles.error">{{ error }}</p>
      <div v-else-if="beacon" :class="styles.page">
        <div :class="styles.headerCard">
          <div><h2 :class="styles.title">{{ beacon.name || 'Porchlight' }}</h2><p v-if="beacon.status_message" :class="styles.statusMessage">{{ beacon.status_message }}</p><p v-if="beacon.description" :class="styles.description">{{ beacon.description }}</p></div>
          <div :class="styles.headerActions">
            <ion-button v-if="canEdit" fill="outline" :router-link="`/porchlight/${beacon.sqid}/edit`">Edit</ion-button>
            <label v-if="canEdit && hasClosePermission" :class="styles.brightnessControl">Bright <ion-range v-model="brightness" :disabled="savingBrightness" :min="0" :max="100" :step="100" aria-label="Brightness" @ion-change="updateBrightness" /> Dim</label>
            <beacon-icon :beacon="beacon" :editable="canEdit" @update="mergeBeacon" />
          </div>
        </div>
        <div v-if="beacon.location" :class="styles.sectionCard"><h3 :class="styles.sectionTitle">Location Map</h3><mapbox-map :location="beacon.location" :name="beacon.name" :status-message="beacon.status_message" :is-on="beacon.is_on" :color="beacon.color || '#F59E0B'" :class-name="styles.map" /></div>
        <div v-if="canManageInvitations" :class="styles.invitationCard">
          <h3 :class="styles.sectionTitle">Invitations</h3><p v-if="invitationError" :class="styles.invitationError">{{ invitationError }}</p>
          <ul :class="styles.invitationList"><li v-for="invitation in invitations" :key="invitation.id" :class="styles.invitationItem"><span>{{ invitation.role_granted || invitation.role || 'view' }} · {{ invitation.accepted_count ?? 0 }} accepted</span><a :href="`/join/${invitation.sqid || invitation.code}`">/join/{{ invitation.sqid || invitation.code }}</a></li></ul>
          <form :class="styles.invitationForm" @submit.prevent="createInvitation"><label>Permission <select v-model="invitationRole"><option value="view">View</option><option value="edit">Edit</option><option value="share">Share</option></select></label><label><input v-model="isGuestInvitation" type="checkbox" /> Guest invitation</label><ion-button type="submit" :disabled="creatingInvitation">{{ creatingInvitation ? 'Creating...' : 'Create invitation' }}</ion-button></form>
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
const invitationRole = ref('view');
const isGuestInvitation = ref(true);
const invitationError = ref('');
const accessError = ref('');
const creatingInvitation = ref(false);
const savingBrightness = ref(false);
const editingAccess = ref<PorchlightAccess | null>(null);
const canEdit = computed(() => Boolean(beacon.value?.is_owner || ['OWNER', 'EDIT'].includes(beacon.value?.user_role || '')));
const canManageInvitations = computed(() => canEdit.value);
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
const loadAccess = async () => { if (!beacon.value?.sqid || !canManageInvitations.value) return; try { const [invites, accessResponse] = await Promise.all([apiClient.get('/invitations/', { params: { porchlight: beacon.value.id } }), apiClient.get(`/porchlights/${beacon.value.sqid}/access/`)]); invitations.value = invites.data; access.value = accessResponse.data.access || []; } catch { accessError.value = 'Unable to load porchlight access.'; } };
const createInvitation = async () => { if (!beacon.value) return; creatingInvitation.value = true; invitationError.value = ''; try { const response = await apiClient.post('/invitations/', { porchlight: beacon.value.id, role: ({ view: 'GUEST', edit: 'MEMBER', share: 'ADMIN' } as Record<string, string>)[invitationRole.value], role_granted: invitationRole.value, is_guest: isGuestInvitation.value, max_uses: 0 }); invitations.value.unshift(response.data); } catch (requestError: any) { invitationError.value = requestError?.response?.data?.detail || 'Unable to create invitation.'; } finally { creatingInvitation.value = false; } };
const updateBrightness = async () => { if (!canEdit.value || !beacon.value?.sqid) return; savingBrightness.value = true; try { const response = await apiClient.post(`/porchlights/${beacon.value.sqid}/control/`, { brightness: brightness.value }); if (response.data?.porchlight) mergeBeacon(response.data.porchlight); } finally { savingBrightness.value = false; } };
onMounted(async () => { await load(); await loadAccess(); });
watch(() => route.params.id, load);
</script>