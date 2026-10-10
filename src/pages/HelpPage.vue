<template>
  <ion-page>
    <ion-content>
      <article :class="$style.page">
        <header :class="$style.intro">
          <p :class="$style.eyebrow">A little help</p>
          <h1>How Porchlights work</h1>
          <p>
            Porchlighting is a simple way to let your people know when you are available. Turn on
            a porchlight, share it with someone, and they can see the light and RSVP.
          </p>
        </header>

        <section :class="$style.card">
          <h2>Use a Porchlight</h2>
          <p>
            Your Neighborhood shows the Porchlights you can access. When you are ready to be found,
            turn your Porchlight on. When you are done, turn it off again. You can create your own
            Porchlight from the home screen and invite people you trust to it.
          </p>
        </section>

        <section :class="$style.card">
          <h2>RSVP to a lit Porchlight</h2>
          <p>
            If someone sends you a Porchlight invitation, open the link. You can join with an
            account or as a guest by entering your name. Once you join, you can see the Porchlight
            and RSVP so the host knows you are on your way or interested.
          </p>
          <p>
            No invitation? Ask the host to send you one. Porchlights are shared only with the people
            the host invites.
          </p>
        </section>

        <section :class="$style.card">
          <h2>Turn on Moth Mode</h2>
          <p>
            Want a little nudge when a Porchlight comes on? Tap the Moth Mode switch in the bottom
            bar and allow notifications when your device asks. Moth Mode will then let you know when
            an accessible Porchlight lights up.
          </p>
          <p>
            You can turn Moth Mode off from the same switch whenever you like. Notifications depend
            on your device and browser settings, so they are helpful reminders—not an emergency
            service.
          </p>
        </section>
      </article>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
</script>

<style module src="./HelpPage.module.css"></style>