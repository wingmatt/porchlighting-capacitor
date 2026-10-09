<template><label :class="$style.toggle"><input type="checkbox" :checked="checked" :aria-label="label" @change="onChange" /><AssetSvg :asset="checked ? 'checkmark.svg' : 'xmark.svg'" :className="$style.icon" />{{ label }}</label></template>
<script setup lang="ts">
import AssetSvg from './AssetSvg.vue';
defineProps<{ label: string; checked: boolean }>();
const emit = defineEmits<{ change: [checked: boolean] }>();
const onChange = (event: Event) => emit('change', (event.target as HTMLInputElement).checked);
</script>
<style module src="./LocationToggle.module.css"></style>