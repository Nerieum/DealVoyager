<script setup lang="ts">
import { computed } from "vue";
import OperatorBadge from "./OperatorBadge.vue";
import type { MobilePlan } from "../types/deals";
import { formatData, formatMoney } from "../utils/deals";

const props = defineProps<{
  deal: MobilePlan;
  isFairplay: boolean;
  isStarOffer?: boolean;
  simPrice: number | null;
  activationPrice: number | null;
  cancellationPrice: number | null;
}>();
const hasUnknownFees = computed(() =>
  [props.simPrice, props.activationPrice, props.cancellationPrice].some(
    (fee) => fee == null,
  ),
);
const annualPrice = computed(
  () =>
    props.deal.price * 12 +
    (props.simPrice ?? 0) +
    (props.activationPrice ?? 0) +
    (props.cancellationPrice ?? 0),
);
const priceParts = computed(() => props.deal.price.toFixed(2).split("."));
const formatFee = (value: number | null) =>
  value == null ? "Non renseigné" : formatMoney(value);
</script>

<template>
  <article
    class="poster-ticket"
    :class="{ 'poster-ticket-star': isStarOffer }"
    :aria-labelledby="`offer-${deal.id}`"
  >
    <div class="poster-ticket-main">
      <div v-if="isStarOffer" class="poster-ticket-topline">
        <span class="poster-ranking">En tête du classement</span>
      </div>
      <OperatorBadge
        :name="deal.operator"
        :network="deal.network || 'Non renseigné'"
        :network-generation="deal.networkGeneration || undefined"
      />
      <h3 :id="`offer-${deal.id}`">{{ deal.planName }}</h3>
      <div class="poster-plan-features">
        <span class="poster-data-amount"
          >{{ formatData(deal.dataGb) }}<small>en France</small></span
        >
        <span
          v-if="deal.dataEuGb != null && deal.dataEuGb > 0"
          class="poster-eu-data"
          >{{ formatData(deal.dataEuGb) }}<small>Europe / DOM</small></span
        >
      </div>
      <p v-if="!isFairplay" class="poster-price-warning">
        <span aria-hidden="true">!</span> Augmentation probable
      </p>
    </div>
    <div class="poster-ticket-price">
      <div
        class="poster-monthly-price"
        :aria-label="`${formatMoney(deal.price)} par mois`"
      >
        <span
          >{{ priceParts[0]
          }}<span class="poster-price-decimals"
            >,{{ priceParts[1] }}</span
          ></span
        ><span class="poster-price-unit">€<small>/ mois</small></span>
      </div>
      <p class="poster-annual-price">
        <span>{{
          hasUnknownFees ? "Minimum sur 12 mois" : "Total sur 12 mois"
        }}</span
        ><strong>{{ formatMoney(annualPrice) }}</strong>
      </p>
      <p v-if="hasUnknownFees" class="poster-unknown-fees">
        Certains frais restent à vérifier.
      </p>
      <p v-else class="poster-known-fees">Carte SIM et frais compris.</p>
      <a
        v-if="deal.url"
        :href="deal.url"
        target="_blank"
        rel="noopener noreferrer"
        class="poster-button poster-offer-link"
        >Voir chez l'opérateur <span aria-hidden="true">↗</span></a
      ><span v-else class="poster-link-unavailable"
        >Lien opérateur indisponible</span
      >
    </div>
    <details class="poster-ticket-details">
      <summary>
        Détails du forfait et des frais <span aria-hidden="true">+</span>
      </summary>
      <dl>
        <div v-if="deal.calls">
          <dt>Appels</dt>
          <dd>{{ deal.calls }}</dd>
        </div>
        <div v-if="deal.sms">
          <dt>SMS/MMS</dt>
          <dd>{{ deal.sms }}</dd>
        </div>
        <div>
          <dt>Carte SIM</dt>
          <dd>{{ formatFee(simPrice) }}</dd>
        </div>
        <div>
          <dt>Activation</dt>
          <dd>{{ formatFee(activationPrice) }}</dd>
        </div>
        <div>
          <dt>Résiliation</dt>
          <dd>{{ formatFee(cancellationPrice) }}</dd>
        </div>
        <div v-if="deal.score != null && deal.score > 0 && deal.dataGb < 9999">
          <dt>Prix par Go</dt>
          <dd>{{ deal.score.toFixed(3).replace(".", ",") }} €/Go</dd>
        </div>
      </dl>
      <p>
        12 × {{ formatMoney(deal.price) }} + carte SIM + activation +
        résiliation.{{
          hasUnknownFees
            ? " Le minimum affiché inclut uniquement les frais renseignés."
            : ""
        }}
      </p>
    </details>
  </article>
</template>
