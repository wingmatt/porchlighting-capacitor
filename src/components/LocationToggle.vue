<template>
  <button
    type="button"
    role="switch"
    :aria-checked="props.checked"
    :aria-label="props.label"
    :class="$style.toggle"
    @click="onClick"
  >
    <AssetSvg
      :asset="props.checked ? 'checkmark.svg' : 'xmark.svg'"
      :className="$style.icon"
    />
    {{ props.label }}
  </button>
</template>
<script setup lang="ts">
import AssetSvg from './AssetSvg.vue';
const emit = defineEmits<{ change: [checked: boolean] }>();

const props = defineProps<{ label: string; checked: boolean }>();

const onClick = () => {
  emit('change', !props.checked);
};
</script>
<style module src="./LocationToggle.module.css"></style>