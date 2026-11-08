<script setup lang="ts">
import OperatorLogo from "./OperatorLogo.vue";
import { getOperatorBrand } from "../utils/operators";
defineProps<{ name: string; network: string; networkGeneration?: string }>();
</script>

<template>
  <div class="poster-operator">
    <span
      class="poster-operator-name"
      :style="{ '--operator-color': getOperatorBrand(name).color }"
      ><OperatorLogo :name="name" /><span>{{ name }}</span></span
    >
    <span class="poster-operator-network">Réseau {{ network }}</span>
    <span v-if="networkGeneration" class="poster-network-generation">{{
      networkGeneration
    }}</span>
  </div>
</template>
