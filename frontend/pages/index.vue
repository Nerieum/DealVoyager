<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DataSlider from "../components/DataSlider.vue";
import DealCard from "../components/DealCard.vue";
import OperatorRoster from "../components/OperatorRoster.vue";
import type { MobilePlan, OperatorSettings, DealStats } from "../types/deals";
import { filterAndSortDeals, getEffectiveFee } from "../utils/deals";
import { analyzedOperatorNames } from "../utils/operators";

const [dealRequest, operatorRequest] = await Promise.all([
  useFetch<MobilePlan[]>("/api/v1/deals", {
    default: () => [],
    lazy: true,
    timeout: 10000,
  }),
  useFetch<OperatorSettings[]>("/api/v1/operators", {
    default: () => [],
    lazy: true,
    timeout: 10000,
  }),
]);
const { data: deals, status: dealStatus, error: dealError } = dealRequest;
const {
  data: operators,
  error: operatorError,
  status: operatorStatus,
} = operatorRequest;
const isLoading = computed(
  () =>
    ["idle", "pending"].includes(dealStatus.value) ||
    ["idle", "pending"].includes(operatorStatus.value),
);
const { data: stats } = useFetch<DealStats>("/api/v1/stats", {
  server: false,
  lazy: true,
  timeout: 10000,
});
const targetDataGb = ref(20);
const targetNetworks = ref(["Orange", "Bouygues", "SFR", "Free"]);
const showAllDeals = ref(false);
const filteredDeals = computed(() =>
  filterAndSortDeals(
    deals.value,
    operators.value,
    targetDataGb.value,
    targetNetworks.value,
  ),
);
const starOffer = computed(() => filteredDeals.value[0]);
const otherOffers = computed(() =>
  showAllDeals.value
    ? filteredDeals.value.slice(1)
    : filteredDeals.value.slice(1, 4),
);
const analyzedOperators = computed(() =>
  [
    ...new Set([
      ...analyzedOperatorNames,
      ...(stats.value?.lastScrape?.outcomes?.map(
        (outcome) => outcome.operator,
      ) ?? []),
      ...deals.value.map((deal) => deal.operator),
    ]),
  ].sort((a, b) => a.localeCompare(b, "fr")),
);
const isFairplay = (operator: string) =>
  operators.value.find((settings) => settings.operatorName === operator)
    ?.isFairplay ?? true;
const fee = (
  deal: MobilePlan,
  field: "simPrice" | "activationPrice" | "cancellationPrice",
) => getEffectiveFee(deal, operators.value, field);
watch([targetDataGb, targetNetworks], () => {
  showAllDeals.value = false;
});
async function retryDeals() {
  await Promise.all([dealRequest.refresh(), operatorRequest.refresh()]);
}
function resetFilters() {
  targetDataGb.value = 20;
  targetNetworks.value = ["Orange", "Bouygues", "SFR", "Free"];
}
const config = useRuntimeConfig();
const discordInviteUrl = computed(() =>
  config.public.discordClientId
    ? `https://discord.com/oauth2/authorize?client_id=${config.public.discordClientId}&scope=${encodeURIComponent("bot applications.commands")}&permissions=19456`
    : null,
);
</script>

<template>
  <div class="poster-home">
    <section
      id="comparer"
      class="poster-shell poster-comparator-layout"
      aria-label="Comparer les forfaits mobiles"
    >
      <div class="poster-controls">
        <DataSlider v-model="targetDataGb" v-model:networks="targetNetworks" />
        <OperatorRoster :operators="analyzedOperators" />
      </div>
      <section
        class="poster-results"
        aria-labelledby="results-title"
        :aria-busy="isLoading"
      >
        <div class="poster-section-heading">
          <div class="poster-results-heading">
            <h2 id="results-title">Les forfaits mobiles</h2>
          </div>
        </div>
        <div v-if="isLoading" class="poster-state" role="status">
          <span class="poster-loading-mark" aria-hidden="true">✳</span>
          <h3>On fait les comptes.</h3>
          <p>Les offres arrivent, un instant…</p>
        </div>
        <div v-else-if="dealError" class="poster-state" role="alert">
          <span class="poster-eyebrow">PETIT CONTRETEMPS</span>
          <h3>Les offres se font attendre.</h3>
          <p>Impossible de récupérer les forfaits. Réessaie dans un instant.</p>
          <button class="poster-button" @click="retryDeals">
            Réessayer <span aria-hidden="true">↻</span>
          </button>
        </div>
        <template v-else>
          <p v-if="operatorError" class="poster-service-notice" role="status">
            Les réglages des opérateurs sont indisponibles. Les frais affichés
            proviennent des offres collectées.
          </p>
          <template v-if="starOffer">
            <DealCard
              :deal="starOffer"
              :is-fairplay="isFairplay(starOffer.operator)"
              is-star-offer
              :sim-price="fee(starOffer, 'simPrice')"
              :activation-price="fee(starOffer, 'activationPrice')"
              :cancellation-price="fee(starOffer, 'cancellationPrice')"
            />
            <div v-if="otherOffers.length" class="poster-alternatives">
              <div class="poster-alternatives-heading">
                <h3>À comparer aussi</h3>
              </div>
              <div id="other-offers" class="poster-alternatives-grid">
                <DealCard
                  v-for="deal in otherOffers"
                  :key="deal.id"
                  :deal="deal"
                  :is-fairplay="isFairplay(deal.operator)"
                  :sim-price="fee(deal, 'simPrice')"
                  :activation-price="fee(deal, 'activationPrice')"
                  :cancellation-price="fee(deal, 'cancellationPrice')"
                />
              </div>
              <div v-if="filteredDeals.length > 4" class="poster-more-offers">
                <button
                  class="poster-button poster-button-outline"
                  :aria-expanded="showAllDeals"
                  aria-controls="other-offers"
                  @click="showAllDeals = !showAllDeals"
                >
                  {{
                    showAllDeals
                      ? "Réduire la liste"
                      : "Voir les autres forfaits"
                  }}<span aria-hidden="true">{{
                    showAllDeals ? "↑" : "↓"
                  }}</span>
                </button>
              </div>
            </div>
          </template>
          <div v-else class="poster-state">
            <span class="poster-eyebrow">AUCUNE CORRESPONDANCE</span>
            <h3>
              {{
                deals.length
                  ? "Pas encore la bonne pioche."
                  : "La table est encore vide."
              }}
            </h3>
            <p>
              {{
                deals.length
                  ? "Essaie un autre volume de données ou sélectionne davantage de réseaux."
                  : "Aucun forfait disponible pour le moment. Reviens un peu plus tard."
              }}
            </p>
            <button
              v-if="deals.length"
              class="poster-button"
              @click="resetFilters"
            >
              Réinitialiser mes critères
              <span aria-hidden="true">↻</span></button
            ><button v-else class="poster-button" @click="retryDeals">
              Actualiser les offres <span aria-hidden="true">↻</span>
            </button>
          </div>
        </template>
      </section>
    </section>

    <div class="poster-shell poster-bottom-grid">
      <section
        id="methode"
        class="poster-method"
        aria-labelledby="method-title"
      >
        <div class="poster-method-intro">
          <h2 id="method-title">Le prix,<br />frais compris.</h2>
          <p class="poster-method-independence">Aucun lien affilié.</p>
        </div>
        <div class="poster-method-content">
          <p class="poster-method-equation">
            12 mois de forfait<span
              >+ carte SIM + activation + résiliation</span
            >
          </p>
          <p>
            On additionne les frais renseignés au prix du forfait. S'il en
            manque, le montant affiché est un minimum : les frais inconnus
            restent à vérifier.
          </p>
          <details class="poster-method-details">
            <summary>
              Comment sont classées les offres ?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Les offres aux frais les mieux renseignés passent d'abord, puis le
              coût sur 12 mois. À 0 Go, le tri se fait par prix mensuel.
            </p>
            <p>
              Une alerte signale les opérateurs privés du label Fairplay pour
              leurs pratiques d'augmentation tarifaire.
            </p>
          </details>
          <p class="poster-method-note">
            Vérifie les conditions chez l'opérateur avant de souscrire.
          </p>
        </div>
      </section>

      <section
        id="discord"
        class="poster-discord"
        aria-labelledby="discord-title"
      >
        <div class="poster-discord-inner">
          <div class="poster-discord-copy">
            <h2 id="discord-title">
              Les alertes,<br /><span>dans ton Discord.</span>
            </h2>
            <p>
              Baisses de prix, nouveaux forfaits : le bot publie les alertes
              directement dans ton salon Discord.
            </p>
            <a
              v-if="discordInviteUrl"
              :href="discordInviteUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="poster-button"
              >Inviter le bot <span aria-hidden="true">↗</span></a
            >
            <p v-else class="poster-discord-unavailable">
              L'invitation du bot est indisponible.
            </p>
          </div>
          <img
            class="poster-discord-image"
            src="/images/discord.png"
            width="800"
            height="450"
            loading="lazy"
            alt="Exemple d'alerte du bot Discord Deal Voyager : opérateur, données et prix du forfait"
          />
        </div>
      </section>
    </div>
  </div>
</template>
