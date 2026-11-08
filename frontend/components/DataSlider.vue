<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{ modelValue: number; networks: string[] }>();
const emit = defineEmits<{
  (event: "update:modelValue", value: number): void;
  (event: "update:networks", value: string[]): void;
}>();
const editValue = ref(String(props.modelValue));
watch(
  () => props.modelValue,
  (value) => {
    editValue.value = String(value);
  },
);
const rangeValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
const networks = [
  { name: "Orange", color: "#d86300" },
  { name: "Bouygues", color: "#007fa4" },
  { name: "SFR", color: "#d01829" },
  { name: "Free", color: "#a51d3a" },
];

function commitValue() {
  const value = Number(editValue.value);
  if (
    editValue.value.trim() !== "" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 500
  )
    emit("update:modelValue", value);
  editValue.value = String(props.modelValue);
}

function toggleNetwork(network: string) {
  emit(
    "update:networks",
    props.networks.includes(network)
      ? props.networks.filter((selected) => selected !== network)
      : [...props.networks, network],
  );
}
</script>

<template>
  <section class="poster-filter" aria-labelledby="criteria-title">
    <div class="poster-data-heading">
      <div>
        <h2 id="criteria-title">Gigas minimum</h2>
      </div>
      <div class="poster-data-value">
        <label class="sr-only" for="data-minimum"
          >Minimum de données en Go</label
        ><input
          id="data-minimum"
          :value="editValue"
          type="number"
          min="0"
          max="500"
          step="1"
          inputmode="numeric"
          @input="editValue = ($event.target as HTMLInputElement).value"
          @change="commitValue"
          @blur="commitValue"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @keydown.escape="editValue = String(modelValue)"
        /><span>Go</span>
      </div>
    </div>
    <label for="data-range" class="sr-only"
      >Ajuster le minimum de données</label
    >
    <input
      id="data-range"
      v-model.number="rangeValue"
      type="range"
      min="0"
      max="500"
      step="5"
      :aria-valuetext="`${modelValue} Go minimum`"
      class="poster-range"
      :style="{ '--range-progress': `${modelValue / 5}%` }"
    />
    <div class="poster-range-limits">
      <span>Tous les volumes</span><span>500 Go</span>
    </div>
    <fieldset class="poster-networks">
      <legend>Réseaux</legend>
      <div class="poster-network-options">
        <button
          v-for="network in networks"
          :key="network.name"
          type="button"
          :aria-pressed="props.networks.includes(network.name)"
          @click="toggleNetwork(network.name)"
        >
          <span
            class="poster-network-dot"
            :style="{ background: network.color }"
            aria-hidden="true"
          />{{ network.name
          }}<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>
    </fieldset>
  </section>
</template>
