<script setup lang="ts">
useHead({
  title: 'Mentions Légales - Deal-Voyager',
  meta: [
    { name: 'description', content: 'Mentions légales du site Deal-Voyager, comparateur de forfaits mobiles.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-background relative overflow-x-hidden pb-32">
    <!-- Header -->
    <div class="container mx-auto px-4 pt-12 pb-8 relative z-10">
      <NuxtLink
        to="/"
        class="neo-button bg-card text-card-foreground hover:bg-primary hover:text-primary-foreground inline-flex items-center gap-2 text-sm uppercase tracking-wider mb-12 transform hover:rotate-1"
      >
        ← Retour à l'accueil
      </NuxtLink>

      <div class="block mt-2 transform -rotate-1">
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground">
          Mentions
          <span class="bg-primary text-primary-foreground px-3 py-1 border-4 border-border shadow-neo inline-block transform rotate-1">
            Légales
          </span>
        </h1>
      </div>
    </div>


    <!-- Content -->
    <main class="container mx-auto px-4 relative z-10 max-w-4xl">

      <!-- Section 1 - Éditeur du site -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 -rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-primary text-primary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            1
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Éditeur du site</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>Le site <span class="bg-primary px-1 font-bold border-2 border-border text-primary-foreground">DealVoyager</span> est édité par :</p>
          <div class="bg-muted border-2 border-border p-5 shadow-neo space-y-1">
            <p class="font-black text-xl uppercase">Association NERIEUM</p>
            <p>Association à but non lucratif (Loi 1908)</p>
            <p class="mt-3 font-bold">Adresse :</p>
            <p>6 Rue Pina Bausch</p>
            <p>67380 Lingolsheim</p>
            <p>France</p>
            <p class="mt-3"><span class="font-bold">Directeur de la publication :</span> Adam SMAIL</p>
          </div>
        </div>
      </section>

      <!-- Section 2 - Hébergement -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-secondary text-secondary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            2
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Hébergement</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>Le site est hébergé par :</p>
          <div class="bg-muted border-2 border-border p-5 shadow-neo space-y-1">
            <p class="font-black text-xl uppercase">Netcup</p>
            <p>netcup GmbH</p>
            <p>Daimlerstraße 9-11</p>
            <p>76185 Karlsruhe</p>
            <p>Allemagne</p>
            <p class="mt-3">
              <span class="font-bold">Site web :</span>
              <a href="https://www.netcup.de" target="_blank" rel="noopener noreferrer" class="underline decoration-2 underline-offset-2 hover:bg-primary hover:text-primary-foreground px-1 transition-colors">netcup.de</a>
            </p>
          </div>
        </div>
      </section>

      <!-- Section 3 - Présentation du site -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 -rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-accent text-accent-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            3
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Présentation du site</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>
            Le site <span class="bg-primary px-1 font-bold border-2 border-border text-primary-foreground">DealVoyager</span> est un comparateur en ligne permettant de consulter et comparer différentes offres de forfaits mobiles proposées par des opérateurs de télécommunications.
          </p>
          <p>
            Les informations affichées sur le site sont fournies à titre informatif et peuvent évoluer à tout moment selon les modifications apportées par les opérateurs.
          </p>
          <p>
            DealVoyager s'efforce de fournir des informations aussi exactes que possible, mais ne peut garantir l'exactitude ou l'actualité permanente des données présentées.
          </p>
        </div>
      </section>

      <!-- Section 4 - Fonctionnement du comparateur -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-destructive text-destructive-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            4
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Fonctionnement du comparateur</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>
            Les offres présentées sur le site proviennent d'informations publiques disponibles sur les sites des opérateurs ou d'autres sources accessibles publiquement.
          </p>
          <p>Le comparateur peut notamment afficher :</p>
          <ul class="space-y-2">
            <li class="flex items-start gap-3">
              <span class="bg-foreground text-background font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">→</span>
              <span>le prix mensuel des forfaits</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-foreground text-background font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">→</span>
              <span>le volume de données inclus</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-foreground text-background font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">→</span>
              <span>le prix par gigaoctet</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-foreground text-background font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">→</span>
              <span>certains frais associés (carte SIM, activation, résiliation)</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-foreground text-background font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">→</span>
              <span>certains indicateurs informatifs liés aux conditions tarifaires</span>
            </li>
          </ul>
          <p>Ces informations sont fournies à titre indicatif.</p>
          <div class="bg-primary/20 border-2 border-border p-4 shadow-neo transform -rotate-[0.5deg]">
            <p class="font-bold">
              ⚠️ L'utilisateur est invité à vérifier les conditions exactes directement sur le site de l'opérateur avant toute souscription.
            </p>
          </div>
        </div>
      </section>

      <!-- Section 5 - Responsabilité -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 -rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-primary text-primary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            5
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Responsabilité</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>DealVoyager ne peut être tenu responsable :</p>
          <ul class="space-y-2">
            <li class="flex items-start gap-3">
              <span class="bg-destructive text-destructive-foreground font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">✕</span>
              <span>des modifications d'offres effectuées par les opérateurs</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-destructive text-destructive-foreground font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">✕</span>
              <span>des erreurs éventuelles dans les informations affichées</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="bg-destructive text-destructive-foreground font-black text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 border-border mt-0.5">✕</span>
              <span>des décisions prises par les utilisateurs sur la base des informations présentes sur le site</span>
            </li>
          </ul>
          <p>Toute souscription à une offre se fait directement auprès de l'opérateur concerné.</p>
        </div>
      </section>

      <!-- Section 6 - Liens externes et affiliation -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-secondary text-secondary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            6
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Liens externes et affiliation</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>Le site DealVoyager peut contenir des liens vers des sites externes appartenant à des opérateurs ou partenaires.</p>
          <p>
            Des <span class="bg-secondary px-1 font-bold border-2 border-border text-secondary-foreground">liens d'affiliation</span> pourront être proposés.
            Dans ce cas, lorsqu'un utilisateur clique sur ces liens et souscrit à une offre, une commission pourra être versée à l'éditeur du site, sans impact sur le prix payé par l'utilisateur.
          </p>
          <p>Ces éventuelles commissions pourraient contribuer au financement du fonctionnement et du développement du site.</p>
        </div>
      </section>

      <!-- Section 7 - Propriété intellectuelle -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 -rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-accent text-accent-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            7
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Propriété intellectuelle</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>
            Les contenus propres au site DealVoyager (textes, design, interface, code, structure et logo) sont protégés par le droit de la propriété intellectuelle.
          </p>
          <p class="font-bold">Toute reproduction ou diffusion sans autorisation est interdite.</p>
          <p>
            Les marques, logos et noms commerciaux des opérateurs mentionnés sur le site (notamment
            <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">B&You</span>,
            <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Sosh</span>,
            <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">RED by SFR</span>,
            <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Free Mobile</span>
            ou tout autre opérateur) sont la propriété exclusive de leurs titulaires respectifs.
          </p>
          <p>Leur présence sur le site a uniquement pour objectif d'identifier les offres comparées.</p>
        </div>
      </section>

      <!-- Section 8 - Données personnelles -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 -rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-primary text-primary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            8
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Données personnelles</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>
            Certaines données techniques liées à la navigation peuvent être collectées afin d'assurer le bon fonctionnement du site et d'améliorer l'expérience utilisateur.
          </p>
          <div class="bg-primary/20 border-2 border-border p-4 shadow-neo transform rotate-[0.3deg]">
            <p class="font-bold mb-2">🔤 Polices d'écriture - Google Fonts</p>
            <p>
              Ce site utilise le service
              <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Google Fonts</span>
              pour l'affichage des polices d'écriture
              <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Anton</span>,
              <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Outfit</span> et
              <span class="bg-muted px-1 border-2 border-border font-bold text-foreground">Space Grotesk</span>.
              Lors du chargement d'une page, votre navigateur établit une connexion avec les serveurs de Google (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis) afin de récupérer ces polices.
              Cette connexion peut entraîner la transmission de votre adresse IP à Google.
            </p>
            <p class="mt-2">
              Pour plus d'informations, consultez la
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="underline decoration-2 underline-offset-2 hover:bg-primary hover:text-primary-foreground px-1 transition-colors font-bold">politique de confidentialité de Google</a>.
            </p>
          </div>
          <p>Pour toute demande relative aux données personnelles, vous pouvez contacter :</p>
          <div class="inline-block bg-primary text-primary-foreground font-black text-lg px-4 py-2 border-4 border-border shadow-neo transform -rotate-1">
            📧 contact@nerieum.fr
          </div>
        </div>
      </section>

      <!-- Section 9 - Droit applicable -->
      <section class="neo-box bg-card p-6 md:p-10 mb-8 transform hover:rotate-0 rotate-[0.3deg]">
        <div class="flex items-start gap-4 mb-6">
          <div class="bg-secondary text-secondary-foreground font-black text-xl w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-border shadow-neo">
            9
          </div>
          <h2 class="text-2xl md:text-3xl font-black uppercase text-card-foreground">Droit applicable</h2>
        </div>
        <div class="space-y-4 text-card-foreground font-medium text-lg leading-relaxed pl-14">
          <p>Les présentes mentions légales sont régies par le droit français.</p>
          <p>Tout litige relatif à l'utilisation du site sera soumis aux juridictions compétentes en France.</p>
        </div>
      </section>

    </main>
  </div>
</template>
