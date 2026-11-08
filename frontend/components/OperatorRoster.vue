<script setup lang="ts">
import OperatorLogo from "./OperatorLogo.vue";
import { getOperatorBrand } from "../utils/operators";
defineProps<{ operators: string[] }>();
</script>

<template>
  <section class="poster-operator-roster" aria-labelledby="operators-title">
    <h2 id="operators-title">Opérateurs analysés</h2>
    <ul>
      <li
        v-for="operator in operators"
        :key="operator"
        class="operator-chip"
        :style="{ '--operator-color': getOperatorBrand(operator).color }"
      >
        <OperatorLogo :name="operator" />
        <span>{{ operator }}</span>
      </li>
    </ul>
  </section>
</template>
