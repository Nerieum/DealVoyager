<script setup lang="ts">
import { computed } from "vue";
import DarkModeSwitch from "../components/DarkModeSwitch.vue";
import HeroSection from "../components/HeroSection.vue";

const route = useRoute();
const isHome = computed(() => route.path === "/");
</script>

<template>
  <div class="poster-site">
    <div class="poster-background-art" aria-hidden="true">
      <svg
        class="poster-margin-mark poster-margin-star"
        viewBox="0 0 100 140"
        fill="none"
      >
        <path
          d="m49 8 8 28 25-16-12 29 26 9-28 8 13 28-26-15-9 29-7-29-26 13 13-27L2 54l29-6-10-27 22 15Z"
          fill="var(--poster-pink)"
          stroke="var(--poster-line)"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M17 125c19-13 41-12 65-5M23 134c18-8 35-8 53-5"
          stroke="var(--poster-violet)"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
      <svg
        class="poster-margin-mark poster-margin-loop"
        viewBox="0 0 100 180"
        fill="none"
      >
        <path
          d="M20 10c60 25 69 60 39 75C19 106 1 49 33 38c31-10 58 56 42 84-14 25-42 12-28-4 10-11 40 12 34 46"
          stroke="var(--poster-doodle)"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="m9 141 10 4m-6-22 8 8m12 19-2 10"
          stroke="var(--poster-line)"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <svg
        class="poster-margin-mark poster-margin-sun"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="23"
          fill="var(--poster-yellow)"
          stroke="var(--poster-line)"
          stroke-width="2"
        />
        <path
          d="m50 6 1 13m30 0-9 10M94 50H81m0 31-10-9M50 94V81M19 81l10-10M6 50h13m0-31 10 10"
          stroke="var(--poster-line)"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <a href="#page-content" class="poster-skip-link">Aller au contenu</a>
    <header
      class="poster-masthead poster-shell"
      :class="{ 'poster-masthead-home': isHome }"
    >
      <div class="poster-masthead-bar">
        <NuxtLink
          to="/"
          class="poster-wordmark"
          aria-label="Deal Voyager, accueil"
        >
          <span class="poster-brand-symbol"
            ><svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path
                d="M8 30V23m8 7V17m8 13V11m8 19V5"
                stroke="currentColor"
                stroke-width="4"
              /></svg
          ></span>
          <span
            >DEAL<span
              >VOYAGER<span class="poster-brand-period">.</span></span
            ></span
          >
        </NuxtLink>
        <nav class="poster-navigation" aria-label="Navigation principale">
          <NuxtLink to="/#comparer">Comparer</NuxtLink
          ><NuxtLink to="/#methode">La méthode</NuxtLink
          ><NuxtLink to="/#discord">Discord</NuxtLink>
        </nav>
        <div class="poster-header-aside">
          <DarkModeSwitch inline />
        </div>
      </div>
      <HeroSection v-if="isHome" />
    </header>

    <!-- Page Content -->
    <main id="page-content" class="poster-page-content">
      <slot />
    </main>

    <footer class="poster-footer">
      <div class="poster-shell">
        <NuxtLink to="/" class="poster-footer-brand"
          >DEAL VOYAGER<span>.</span></NuxtLink
        >
        <nav class="poster-footer-links" aria-label="Informations du site">
          <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
          <a
            href="https://x.com/doalou"
            target="_blank"
            rel="noopener noreferrer"
            >Signaler un problème <span aria-hidden="true">↗</span></a
          >
        </nav>
        <div class="poster-footer-meta">
          <span>© {{ new Date().getFullYear() }} Deal Voyager · @doalou</span
          ><span>Site en bêta</span>
        </div>
      </div>
    </footer>
  </div>
</template>
