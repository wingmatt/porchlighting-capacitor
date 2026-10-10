<template>
  <img v-if="!graphic" :class="classes" :src="url" :alt="props.label ?? ''" :aria-hidden="!props.label" />
  <svg v-else :class="classes" :role="props.label ? 'img' : undefined" :aria-label="props.label" :aria-hidden="!props.label" :viewBox="graphic.viewBox" preserveAspectRatio="xMidYMid meet" v-html="`${colorStyles(props.colorVariables)}${graphic.markup}`" />
</template>
<script setup lang="ts">
import { computed, ref, useCssModule, watch } from 'vue';
import { ASSET_URL } from '../constants';
interface AssetSvgProps {
  asset: string;
  className?: string;
  label?: string;
  colorVariables?: Record<string, string>;
}

interface LoadedAsset {
  markup: string;
  viewBox: string;
}
const props = defineProps<AssetSvgProps>();
const styles = useCssModule();
const loadedAssets = new Map<string, Promise<LoadedAsset>>();
const url = computed(() => `${ASSET_URL}/${props.asset.replace(/^\/+/, '')}`);
const graphic = ref<LoadedAsset | null>(null);
const classes = computed(() => `${styles.icon} ${props.className ?? ''}`);
const colorStyles = (variables: Record<string, string> = {}) => (
  Object.entries(variables)
    .map(([selector, variable]) => `${selector}{color:var(${variable});fill:currentColor;}`)
    .join('')
);

const loadAsset = (assetUrl: string): Promise<LoadedAsset> => {
  const cached = loadedAssets.get(assetUrl);
  if (cached) return cached;
  const request = fetch(assetUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load SVG asset (${response.status})`);
      return response.text();
    })
    .then((source) => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      if (svg.nodeName.toLowerCase() !== 'svg') throw new Error('Invalid SVG asset');
      return {
        markup: svg.innerHTML,
        viewBox: svg.getAttribute('viewBox') || '0 0 100 100',
      };
    });
  loadedAssets.set(assetUrl, request);
  return request;
};
watch(url, (nextUrl) => {
  graphic.value = null;
  loadAsset(nextUrl)
    .then((loaded) => {
      if (url.value === nextUrl) graphic.value = loaded;
    })
    .catch(() => {
      // The image fallback still works when the asset server disallows CORS fetches.
    });
}, { immediate: true });
</script>
<style module src="./AssetSvg.module.css"></style>