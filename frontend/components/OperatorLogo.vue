<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getOperatorBrand } from "../utils/operators";

const props = defineProps<{ name: string }>();
const brand = computed(() => getOperatorBrand(props.name));
const failed = ref(false);
const logoElement = ref<HTMLImageElement | null>(null);
onMounted(() => {
  if (logoElement.value?.complete && logoElement.value.naturalWidth === 0)
    failed.value = true;
});
watch(
  () => props.name,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <span class="operator-logo" aria-hidden="true">
    <img
      v-if="brand.logo && !failed"
      ref="logoElement"
      :src="brand.logo"
      alt=""
      decoding="async"
      @error="failed = true"
    />
    <span
      v-else
      class="operator-logo-fallback"
      :style="{ background: brand.color }"
    />
  </span>
</template>
