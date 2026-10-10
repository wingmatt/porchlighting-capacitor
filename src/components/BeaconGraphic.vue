<template>
  <AssetSvg
    :asset="isOn ? BEACON_LIT_ICON : BEACON_UNLIT_ICON"
    :className="`${$style.icon} ${className ?? ''}`"
    :label="label"
    :colorVariables="{ '#beacon-base': '--inactive-color', '#beacon-lit': '--active-color' }"
  />
</template>
<script setup lang="ts">
import { BEACON_LIT_ICON, BEACON_UNLIT_ICON } from '../constants';
import AssetSvg from './AssetSvg.vue';
withDefaults(defineProps<{ isOn: boolean; className?: string; label: string }>(), { className: '' });
</script>
<style module src="./BeaconGraphic.module.css"></style>