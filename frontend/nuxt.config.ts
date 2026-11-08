import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  modules: ["@nuxtjs/color-mode"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    apiInternalUrl: "http://localhost:3001",
    public: {
      discordClientId: "1285307038930309122",
    },
  },
  colorMode: {
    classSuffix: "",
  },
  app: {
    head: {
      title: "Deal-Voyager - Ton Forfait, Ton Choix",
      meta: [
        {
          name: "description",
          content:
            "Le seul comparateur de forfaits mobiles français qui classe vos offres au centime près, sans partenariat, sans pub, sans bullshit. Juste les vrais prix.",
        },
        { name: "theme-color", content: "#FFD000" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap",
        },
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
      ],
    },
  },
});
