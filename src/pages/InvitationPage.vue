<template>
  <ion-page>
    <ion-content>
      <div v-if="!data" class="loading">Loading invitation...</div>
      <div v-else class="page">
        <div class="card">
          <h2 class="title">Welcome {{ data.has_permission ? 'back ' : '' }}to <span>{{ data.beacon.name }}</span></h2>
          <p v-if="!data.has_permission">Someone wants you to know when their porchlight is lit! It's quick to join:</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <form v-if="canAcceptAsUser" class="joinForm" @submit.prevent="handleJoin()">
            <ion-button type="submit" expand="block" class="button primaryButton" :disabled="saving">{{ saving ? 'Accepting...' : `Accept invitation as ${user?.email}` }}</ion-button>
          </form>
          <form v-if="canJoinAsGuest" class="joinForm" @submit.prevent="handleJoin(true)">
            <label v-if="!guestToken">Name (required)<ion-input v-model="guestName" type="text" placeholder="Your Name (Guest)" required class="input" /></label>
            <ion-button type="submit" expand="block" class="button primaryButton" :disabled="saving">{{ saving ? 'Joining...' : guestToken ? `Join as ${guestName}` : 'Join as a Guest' }}</ion-button>
          </form>
          <form v-if="canJoinExistingUserAsGuest" class="joinForm" @submit.prevent="handleJoin(true)">
            <label>Name (required)<ion-input v-model="guestName" type="text" placeholder="Your Name (Guest)" required class="input" /></label>
            <ion-button type="submit" expand="block" class="button primaryButton" :disabled="saving">{{ saving ? 'Joining...' : 'Join Beacon' }}</ion-button>
          </form>
          <template v-if="!data.has_permission">
            <p>What could this porchlight represent?</p>
            <ul><li>Freeform in-person hangouts?</li><li>Hoppin' online to the gamerverse?</li><li>Body doubling availability?</li><li>Presence at a third space?</li><li>Parents that can socialize for once?</li><li>Some mysterious other situation?</li></ul>
            <p>You should know from the name or the context of the invite - or you should ask!</p>
            <p>No matter what, it's the kind of invitation that allows a vampire to enter but doesn't spam the group chat. The new glue for this wonky social age.</p>
            <p>Just give us your name and send a moth to let 'em know you're coming.</p>
            <p>If you want to set up your own porchlight, <router-link to="/register">make a full account here</router-link>.</p>
          </template>
          <ion-button v-if="data.has_permission" expand="block" class="button darkButton" @click="router.push(`/porchlight/${data.beacon.sqid}`)">View Porchlight</ion-button>
          <ion-button v-if="data.can_share" expand="block" class="button secondaryButton" @click="copyInvitationLink">Copy invitation link</ion-button>
          <p v-if="copyStatus" class="copyStatus">{{ copyStatus }}</p>
          <div v-if="data.can_manage" class="managementSection">
            <ion-button expand="block" class="button secondaryButton" :disabled="participantAction" @click="toggleParticipants">{{ showParticipants ? 'Hide accepted participants' : 'Show accepted participants' }}</ion-button>
            <div v-if="showParticipants" class="participantList">
              <p class="code">Current Invitation Code: {{ invitationSqid }}</p>
              <div v-if="qrCode" class="qrCode"><img :src="qrCode" alt="QR code for the invitation link"><span>Scan to open the invitation</span></div>
              <p v-if="participantError" class="error">{{ participantError }}</p>
              <p v-if="participants.length === 0" class="description">No users or guests have accepted this invitation.</p>
              <div v-for="participant in participants" :key="participant.id" class="participantItem"><span>{{ participant.name || participant.email || 'Guest' }}{{ participant.email ? ` · ${participant.email}` : '' }}</span><ion-button class="button revokeButton" :disabled="participantAction" @click="revokeParticipant(participant)">Revoke</ion-button></div>
              <ion-button expand="block" class="button dangerButton" :disabled="participantAction || participants.length === 0" @click="revokeAllParticipants">Revoke everyone and refresh code</ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButton, IonContent, IonInput, IonPage } from '@ionic/vue';
import QRCode from 'qrcode';
import { apiClient, getCredentials, setGuestCredentials } from '../api/client';
import type { Beacon, Invitation, InvitationParticipant } from '../types';
import { useAuth } from '../auth';
import { signInToFirebase } from '../firebase';

interface InvitationData { invitation: Invitation; beacon: Beacon; has_permission: boolean; can_manage: boolean; can_share: boolean }
const route = useRoute();
const router = useRouter();
const { user, loading: authLoading } = useAuth();
const data = ref<InvitationData | null>(null);
const guestName = ref('');
const guestToken = ref('');
const error = ref('');
const saving = ref(false);
const showParticipants = ref(false);
const participants = ref<InvitationParticipant[]>([]);
const participantError = ref('');
const participantAction = ref(false);
const copyStatus = ref('');
const qrCode = ref('');
const sqid = computed(() => String(route.params.sqid || ''));
const invitationSqid = computed(() => data.value?.invitation.sqid || sqid.value);
const invitationLink = computed(() => invitationSqid.value ? `${window.location.origin}/join/${invitationSqid.value}` : '');
const canAcceptAsUser = computed(() => !authLoading.value && !data.value?.has_permission && Boolean(data.value?.invitation.is_valid && !data.value.invitation.is_guest && user.value));
const canJoinAsGuest = computed(() => !authLoading.value && !data.value?.has_permission && Boolean(data.value?.invitation.is_valid && !user.value));
const canJoinExistingUserAsGuest = computed(() => !authLoading.value && !data.value?.has_permission && Boolean(data.value?.invitation.is_valid && data.value.invitation.is_guest && user.value));

const load = async () => {
  const credentials = getCredentials();
  guestToken.value = credentials.guestToken || '';
  guestName.value = credentials.guestName || '';
  if (sqid.value && !authLoading.value) {
    try { const response = await apiClient.get(`/invitations/validate/${sqid.value}/`); data.value = { ...response.data, invitation: response.data, beacon: response.data.porchlight }; }
    catch { error.value = 'This invitation could not be found.'; }
  }
};
watch([sqid, authLoading], load, { immediate: true });
watch(invitationLink, (link) => { if (!link) { qrCode.value = ''; return; } QRCode.toDataURL(link, { width: 220, margin: 1 }).then((url) => { qrCode.value = url; }).catch(() => { qrCode.value = ''; }); });
onMounted(load);

const loadParticipants = async () => { if (!sqid.value || !data.value?.can_manage) return; participantError.value = ''; try { participants.value = (await apiClient.get(`/invitations/manage/${sqid.value}/`)).data.participants || []; } catch (e: any) { participantError.value = e?.response?.data?.detail || 'Unable to load accepted participants.'; } };
const toggleParticipants = async () => { showParticipants.value = !showParticipants.value; if (showParticipants.value) await loadParticipants(); };
const revokeParticipant = async (participant: InvitationParticipant) => { if (!sqid.value || !window.confirm(`Revoke ${participant.name || participant.email || 'this participant'}'s permission?`)) return; participantAction.value = true; participantError.value = ''; try { await apiClient.delete(`/invitations/manage/${sqid.value}/`, { data: { permission_id: participant.id } }); participants.value = participants.value.filter((item) => item.id !== participant.id); } catch (e: any) { participantError.value = e?.response?.data?.detail || 'Unable to revoke this permission.'; } finally { participantAction.value = false; } };
const revokeAllParticipants = async () => { if (!sqid.value || !window.confirm('Revoke everyone\'s permission and refresh this invitation code?')) return; participantAction.value = true; participantError.value = ''; try { const response = await apiClient.post(`/invitations/manage/${sqid.value}/revoke-all/`); participants.value = []; await router.push(`/join/${response.data.sqid}`); } catch (e: any) { participantError.value = e?.response?.data?.detail || 'Unable to revoke all permissions.'; } finally { participantAction.value = false; } };
const copyInvitationLink = async () => { try { await navigator.clipboard.writeText(invitationLink.value); copyStatus.value = 'Invitation link copied.'; } catch { copyStatus.value = 'Unable to copy the invitation link.'; } };
const handleJoin = async (guestSignup = false) => { if (!data.value) return; error.value = ''; saving.value = true; try { if (guestSignup) { const response = await apiClient.post('/guest/access/', { invitation_code: sqid.value, guest_name: guestName.value }); await setGuestCredentials(response.data.guest_token, response.data.guest_name); await signInToFirebase(response.data.firebase_token); } else await apiClient.post('/invitations/accept/', { code: sqid.value }); await router.push(`/porchlight/${data.value.beacon.sqid}`); } catch (e: any) { error.value = e?.response?.data?.detail || e?.response?.data?.error || 'Unable to accept this invitation.'; } finally { saving.value = false; } };
</script>

<style src="./InvitationPage.module.css"></style>