import { Configuration, NonRetryableError, ProxyConfiguration, log } from '@crawlee/core';
import { CheerioCrawler } from '@crawlee/cheerio';
import { PlaywrightCrawler } from '@crawlee/playwright';
import type { Page } from 'playwright';
import prisma from '../lib/prisma';
import type {
  MobileNetwork,
  OperatorDefinition,
  ScrapedPlan,
  ScrapeOutcome,
  ScrapeRunSummary,
} from './scrapers/types';
import { soshScrapeLogic } from './scrapers/sosh.scraper';
import { redScrapeLogic } from './scrapers/red.scraper';
import { bAndYouHtmlScrapeLogic, bAndYouScrapeLogic } from './scrapers/byou.scraper';
import { freeMobileScrapeLogic } from './scrapers/free.scraper';
import { youPriceScrapeLogic } from './scrapers/youprice.scraper';
import { coriolisScrapeLogic } from './scrapers/coriolis.scraper';
import { laPosteMobileScrapeLogic } from './scrapers/laposte.scraper';
import { auchanTelecomScrapeLogic } from './scrapers/auchan.scraper';
import { nrjMobileScrapeLogic } from './scrapers/nrj.scraper';
import { cdiscountMobileScrapeLogic } from './scrapers/cdiscount.scraper';
import { symaMobileHtmlScrapeLogic, symaMobileScrapeLogic } from './scrapers/syma.scraper';
import { lebaraHtmlScrapeLogic, lebaraScrapeLogic } from './scrapers/lebara.scraper';
import { lycamobileScrapeLogic } from './scrapers/lycamobile.scraper';
import { prixtelScrapeLogic } from './scrapers/prixtel.scraper';
import { telecoopHtmlScrapeLogic, telecoopScrapeLogic } from './scrapers/telecoop.scraper';
import { akeoHtmlScrapeLogic, akeoScrapeLogic } from './scrapers/akeo.scraper';
import { nordnetScrapeLogic } from './scrapers/nordnet.scraper';
import { franceTelephoneHtmlScrapeLogic, franceTelephoneScrapeLogic } from './scrapers/francetelephone.scraper';
import { detectFeesFromCheckout, extractCheckoutCandidateUrls, extractTariffPdfUrl, fetchFeesFromPdf, fetchFeesFromWebPage } from './scrapers/utils';
import { broadcastDeal } from './discord.service';

const DEFAULT_CONCURRENCY = 3;
// Chaque page Chromium pèse plusieurs centaines de Mo : on limite le navigateur
// plus strictement que le crawler HTTP pour rester sous CRAWLEE_MEMORY_MBYTES.
const DEFAULT_BROWSER_CONCURRENCY = 2;
const BROWSER_RETIRE_AFTER_PAGES = 6;
const DEFAULT_REQUEST_TIMEOUT_SECS = 90;
const DEFAULT_RETRIES = 2;
const FORBIDDEN_OFFER_PATTERN = /\b(box|bleubox|bleufix|fibre|adsl|smartphone|t[ée]l[ée]phone inclus|engagement\s*(?:12|24)\s*mois)\b/i;
const BLOCKED_PAGE_PATTERN = /datadome|cf-chl-|cloudflare ray id|g-recaptcha|h-captcha|captcha challenge|access denied|accès bloqué|accès refusé|verify you are human|v[ée]rification de s[ée]curit[ée] en cours|v[ée]rifiez que vous êtes humain/i;

export const operatorDefinitions: readonly OperatorDefinition[] = [
  {
    name: 'Sosh',
    url: 'https://shop.sosh.fr/mobile/forfaits-mobiles',
    mode: 'http',
    networks: ['Orange'],
    minOffers: 4,
    scrapeFunction: soshScrapeLogic,
  },
  {
    name: 'RED by SFR',
    url: 'https://www.red-by-sfr.fr/forfaits-mobiles/',
    mode: 'browser',
    networks: ['SFR'],
    minOffers: 4,
    scrapeFunction: redScrapeLogic,
  },
  {
    name: 'B&You',
    // L'ancienne page /forfaits-mobiles/b-and-you renvoie 404 depuis la refonte.
    url: 'https://www.bouyguestelecom.fr/forfaits-mobiles/sans-engagement',
    mode: 'http',
    networks: ['Bouygues Telecom'],
    minOffers: 4,
    pdfUrl: 'https://www.bouyguestelecom.fr/static/cms/tarifs/Guide_Des_Tarifs.pdf',
    findPdfUrl: findTariffPdf,
    htmlScrapeFunction: bAndYouHtmlScrapeLogic,
    scrapeFunction: bAndYouScrapeLogic,
  },
  {
    name: 'Free Mobile',
    url: 'https://mobile.free.fr/',
    mode: 'browser',
    networks: ['Free'],
    minOffers: 3,
    pdfUrl: 'https://mobile.free.fr/docs/bt/tarifs.pdf',
    scrapeFunction: freeMobileScrapeLogic,
  },
  {
    name: 'YouPrice',
    url: 'https://www.youprice.fr/forfaits',
    mode: 'browser',
    networks: ['Orange', 'SFR', 'Bouygues Telecom'],
    minOffers: 3,
    scrapeFunction: youPriceScrapeLogic,
  },
  {
    name: 'Coriolis',
    url: 'https://www.coriolis.com/forfaits-sans-mobile',
    mode: 'http',
    networks: ['SFR'],
    minOffers: 3,
    scrapeFunction: coriolisScrapeLogic,
  },
  {
    name: 'La Poste Mobile',
    url: 'https://www.lapostemobile.fr/offres-mobiles/forfaits-sans-engagement',
    mode: 'browser',
    networks: ['Bouygues Telecom'],
    minOffers: 2,
    pdfUrl: 'https://medias.lapostemobile.fr/portail_mobile/pdf/portail_web/LPM-Recapitulatif-contractuel-SIM.pdf',
    scrapeFunction: laPosteMobileScrapeLogic,
  },
  {
    name: 'NRJ Mobile',
    url: 'https://www.nrjmobile.fr/forfait-se',
    mode: 'http',
    networks: ['Bouygues Telecom'],
    minOffers: 4,
    pdfUrl: 'https://www.nrjmobile.fr/pdf/nrj-mobile-cgs.pdf',
    scrapeFunction: nrjMobileScrapeLogic,
  },
  {
    name: 'Auchan Telecom',
    url: 'https://www.auchantelecom.fr/forfait-se',
    mode: 'http',
    networks: ['Bouygues Telecom'],
    minOffers: 3,
    pdfUrl: 'https://www.auchantelecom.fr/pdf/auchan-telecom-cgs.pdf',
    scrapeFunction: auchanTelecomScrapeLogic,
  },
  {
    name: 'Cdiscount Mobile',
    url: 'https://www.cdiscount.com/cdiscount-mobile/v-164-0.html',
    mode: 'http',
    networks: ['Bouygues Telecom'],
    minOffers: 4,
    pdfUrl: 'https://cdiscountmobile.cdiscount.com/pdf/cdiscount-mobile-cgs.pdf',
    scrapeFunction: cdiscountMobileScrapeLogic,
  },
  {
    name: 'Syma Mobile',
    url: 'https://www.symamobile.com/forfait',
    mode: 'http',
    networks: ['SFR'],
    minOffers: 3,
    pdfUrl: 'https://api.symamobile.com/fr_FR/docs/legal/dl/brochure-tarifaire-forfaits-sans-engagement-symamobile.pdf',
    htmlScrapeFunction: symaMobileHtmlScrapeLogic,
    scrapeFunction: symaMobileScrapeLogic,
  },
  {
    name: 'Lebara',
    url: 'https://www.lebara.fr/fr/forfait-mensuel.html',
    mode: 'http',
    networks: ['SFR'],
    minOffers: 3,
    htmlScrapeFunction: lebaraHtmlScrapeLogic,
    scrapeFunction: lebaraScrapeLogic,
  },
  {
    name: 'Lycamobile',
    url: 'https://www.lycamobile.fr/abo/fr/bundles/sim-only-deals/',
    mode: 'browser',
    networks: ['Bouygues Telecom'],
    minOffers: 2,
    scrapeFunction: lycamobileScrapeLogic,
  },
  {
    name: 'Prixtel',
    url: 'https://www.prixtel.com/forfait-mobile/',
    mode: 'browser',
    networks: ['SFR'],
    minOffers: 3,
    findPdfUrl: findPrixtelPdf,
    scrapeFunction: prixtelScrapeLogic,
  },
  {
    name: 'TeleCoop',
    url: 'https://telecoop.fr/particuliers',
    mode: 'http',
    networks: ['Orange'],
    minOffers: 2,
    htmlScrapeFunction: telecoopHtmlScrapeLogic,
    scrapeFunction: telecoopScrapeLogic,
  },
  {
    name: 'Akeo Telecom',
    url: 'https://www.akeotelecom.com/mobile/forfaits',
    mode: 'http',
    networks: ['Orange', 'Bouygues Telecom'],
    minOffers: 4,
    htmlScrapeFunction: akeoHtmlScrapeLogic,
    scrapeFunction: akeoScrapeLogic,
  },
  {
    name: 'Nordnet',
    url: 'https://www.nordnet.com/forfaits-mobile',
    mode: 'browser',
    networks: ['Orange'],
    minOffers: 5,
    feeSourceUrl: 'https://www.nordnet.com/tarifs',
    scrapeFunction: nordnetScrapeLogic,
  },
  {
    name: 'France Téléphone',
    legacyNames: ['France Telephone'],
    url: 'https://www.france-telephone.com/forfaits-mobiles',
    mode: 'http',
    networks: ['Orange', 'Bouygues Telecom'],
    minOffers: 8,
    htmlScrapeFunction: franceTelephoneHtmlScrapeLogic,
    scrapeFunction: franceTelephoneScrapeLogic,
  },
] as const;

let activeCrawler: PlaywrightCrawler | null = null;
let activeRun: Promise<ScrapeRunSummary> | null = null;
let latestRunSummary: ScrapeRunSummary | null = null;

export const isScrapeRunning = () => activeRun !== null;
export const getLatestScrapeSummary = () => latestRunSummary;

export const closeActiveBrowser = async () => {
  const crawler = activeCrawler;
  if (!crawler) return;

  try {
    crawler.autoscaledPool?.abort();
    await crawler.browserPool?.destroy();
  } catch (error) {
    console.error('[Crawlee] Erreur pendant la fermeture du navigateur :', error);
  } finally {
    activeCrawler = null;
  }
};

export const scrapeOffers = (): Promise<ScrapeRunSummary> => {
  if (activeRun) {
    console.warn('[Crawlee] Une collecte est déjà en cours, réutilisation de son résultat.');
    return activeRun;
  }

  activeRun = runScrape().finally(() => {
    activeRun = null;
  });
  return activeRun;
};

async function runScrape(): Promise<ScrapeRunSummary> {
  const startedAt = new Date();
  const outcomes: ScrapeOutcome[] = [];
  const outcomeOperators = new Set<string>();
  const definitionsByName = new Map(operatorDefinitions.map((definition) => [definition.name, definition]));
  const proxyUrls = splitEnvList(process.env.SCRAPER_PROXY_URLS);
  const proxyConfiguration = proxyUrls.length > 0
    ? new ProxyConfiguration({ proxyUrls })
    : undefined;
  const maxConcurrency = readPositiveInteger(process.env.SCRAPER_MAX_CONCURRENCY, DEFAULT_CONCURRENCY);
  const browserConcurrency = Math.min(
    maxConcurrency,
    readPositiveInteger(process.env.SCRAPER_BROWSER_MAX_CONCURRENCY, DEFAULT_BROWSER_CONCURRENCY),
  );
  const requestTimeoutSecs = readPositiveInteger(process.env.SCRAPER_TIMEOUT_SECS, DEFAULT_REQUEST_TIMEOUT_SECS);
  const maxRequestRetries = readNonNegativeInteger(process.env.SCRAPER_MAX_RETRIES, DEFAULT_RETRIES);
  const headless = process.env.SCRAPER_HEADLESS !== 'false';
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;
  const extraArgs = splitEnvList(process.env.PLAYWRIGHT_ARGS, ' ');

  const crawleeConfig = new Configuration({
    persistStorage: false,
    purgeOnStart: true,
  });

  console.log(`[Crawlee] Démarrage de ${operatorDefinitions.length} opérateurs, concurrence HTTP ${maxConcurrency}, navigateur ${browserConcurrency}.`);

  const completeOperator = async (
    definition: OperatorDefinition,
    rawPlans: ScrapedPlan[],
    page: Page | undefined,
    attempts: number,
    actualMode: 'http' | 'browser',
    operatorStartedAt: number,
    checkoutCandidateUrls: readonly string[] = [],
    discoveredPdfUrl: string | null = null,
  ) => {
    const plans = validateAndNormalizePlans(definition, rawPlans);
    if (plans.length < definition.minOffers) {
      throw new Error(`Résultat incomplet : ${plans.length}/${definition.minOffers} offre(s) minimum`);
    }
    const persistence = await enrichAndPersistPlans(definition, page, plans, checkoutCandidateUrls, discoveredPdfUrl);
    const status = persistence.saveErrors > 0 ? 'partial' : 'success';
    const outcome: ScrapeOutcome = {
      operator: definition.name,
      status,
      offers: plans.length,
      durationMs: Date.now() - operatorStartedAt,
      mode: actualMode,
      attempts,
      purgeSkipped: persistence.purgeSkipped,
      ...(persistence.saveErrors > 0
        ? { error: `${persistence.saveErrors} sauvegarde(s) en erreur` }
        : {}),
    };
    outcomes.push(outcome);
    outcomeOperators.add(definition.name);
    log.info(`[${definition.name}] ${plans.length} offre(s) validée(s) via ${actualMode} en ${outcome.durationMs} ms.`);
  };

  const httpDefinitions = operatorDefinitions.filter((definition) =>
    definition.mode === 'http' && definition.htmlScrapeFunction,
  );
  if (httpDefinitions.length > 0) {
    const httpCrawler = new CheerioCrawler({
      maxConcurrency,
      maxRequestRetries,
      requestHandlerTimeoutSecs: requestTimeoutSecs,
      useSessionPool: true,
      persistCookiesPerSession: true,
      proxyConfiguration,
      requestHandler: async ({ request, body, response, session }) => {
        const operatorName = String(request.userData.operatorName || '');
        const definition = definitionsByName.get(operatorName);
        if (!definition?.htmlScrapeFunction) throw new Error(`Extracteur HTTP introuvable : ${operatorName}`);
        if (response.statusCode === 403 || response.statusCode === 429) {
          session?.retire();
          throw new Error(`BLOCKED_HTTP_${response.statusCode}`);
        }
        throwIfPageGone(response.statusCode, request.loadedUrl ?? request.url);
        const html = typeof body === 'string' ? body : body.toString('utf8');
        if (isBlockedContent(html)) {
          session?.retire();
          throw new Error('BLOCKED_PAGE_DETECTED');
        }
        const rawPlans = await definition.htmlScrapeFunction(html, request.loadedUrl ?? request.url);
        try {
          await completeOperator(
            definition,
            rawPlans,
            undefined,
            request.retryCount + 1,
            'http',
            Number(request.userData.startedAt || Date.now()),
          );
        } catch (error) {
          // Un parseur HTTP vide ne produira pas davantage d'offres en relisant
          // exactement la même réponse. On passe immédiatement à Playwright.
          if (error instanceof Error && error.message.startsWith('Résultat incomplet')) {
            throw new NonRetryableError(error.message);
          }
          throw error;
        }
      },
      failedRequestHandler: async ({ request }, error) => {
        console.warn(`[${String(request.userData.operatorName)}] HTTP insuffisant, repli vers Playwright : ${error.message}`);
      },
    }, crawleeConfig);
    await httpCrawler.run(httpDefinitions.map((definition) => ({
      url: definition.url,
      uniqueKey: `http:${definition.name}`,
      userData: { operatorName: definition.name, startedAt: Date.now() },
    })));
  }

  const browserDefinitions = operatorDefinitions.filter((definition) => !outcomeOperators.has(definition.name));

  const crawler = new PlaywrightCrawler({
    maxConcurrency: browserConcurrency,
    maxRequestRetries,
    requestHandlerTimeoutSecs: requestTimeoutSecs,
    navigationTimeoutSecs: Math.min(requestTimeoutSecs, 60),
    useSessionPool: true,
    persistCookiesPerSession: true,
    proxyConfiguration,
    launchContext: {
      launchOptions: {
        headless,
        executablePath,
        args: [
          '--disable-dev-shm-usage',
          '--ignore-certificate-errors',
          '--disable-blink-features=AutomationControlled',
          '--lang=fr-FR,fr',
          ...extraArgs,
        ],
      },
    },
    browserPoolOptions: {
      useFingerprints: true,
      maxOpenPagesPerBrowser: browserConcurrency,
      // Recycler Chromium régulièrement évite l'accumulation de mémoire
      // (pages de checkout, PDF, scripts tiers) au fil des opérateurs.
      retireBrowserAfterPageCount: BROWSER_RETIRE_AFTER_PAGES,
      closeInactiveBrowserAfterSecs: 60,
    },
    preNavigationHooks: [async ({ page }, gotoOptions) => {
      gotoOptions.waitUntil = 'domcontentloaded';
      await preparePage(page);
    }],
    requestHandler: async ({ request, page, response, session }) => {
      const operatorName = String(request.userData.operatorName || '');
      const definition = definitionsByName.get(operatorName);
      if (!definition) throw new Error(`Configuration opérateur introuvable : ${operatorName}`);

      const operatorStartedAt = Number(request.userData.startedAt || Date.now());
      const statusCode = response?.status();
      if (statusCode === 403 || statusCode === 429) {
        session?.retire();
        throw new Error(`BLOCKED_HTTP_${statusCode}`);
      }
      throwIfPageGone(statusCode, page.url());

      let initialHtml = await page.content();
      if (isBlockedContent(initialHtml)) {
        // Certains challenges JS (notamment Baleen) posent un cookie puis
        // rechargent automatiquement la vraie page.
        await page.waitForTimeout(8000);
        initialHtml = await page.content();
        if (isBlockedContent(initialHtml)) {
          session?.retire();
          throw new Error('BLOCKED_PAGE_DETECTED');
        }
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => undefined);
      await page.waitForTimeout(1200);

      const checkoutLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((link) => ({
        href: link.getAttribute('href') || '',
        text: link.textContent || '',
      })));
      const checkoutCandidateUrls = extractCheckoutCandidateUrls(page.url(), checkoutLinks);
      const discoveredPdfUrl = await definition.findPdfUrl?.(page).catch(() => null)
        ?? extractTariffPdfUrl(page.url(), checkoutLinks);
      const rawPlans = await definition.scrapeFunction(page);
      await completeOperator(
        definition,
        rawPlans,
        page,
        request.retryCount + 1,
        'browser',
        operatorStartedAt,
        checkoutCandidateUrls,
        discoveredPdfUrl,
      );
    },
    failedRequestHandler: async ({ request }, error) => {
      const operatorName = String(request.userData.operatorName || 'Inconnu');
      if (outcomeOperators.has(operatorName)) return;
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({
        operator: operatorName,
        // « Request blocked - received 403 status code. » est levé par Crawlee lui-même.
        status: /BLOCKED_|request blocked|captcha|datadome|cloudflare/i.test(message) ? 'blocked' : 'failed',
        offers: 0,
        durationMs: Date.now() - Number(request.userData.startedAt || Date.now()),
        mode: 'browser',
        attempts: request.retryCount + 1,
        error: message,
        purgeSkipped: true,
      });
      outcomeOperators.add(operatorName);
      console.error(`[${operatorName}] Collecte abandonnée : ${message}`);
    },
  }, crawleeConfig);

  activeCrawler = crawler;
  try {
    await crawler.run(browserDefinitions.map((definition) => ({
      url: definition.url,
      uniqueKey: `browser:${definition.name}`,
      userData: {
        operatorName: definition.name,
        startedAt: Date.now(),
        preferredMode: definition.mode,
      },
    })));
  } finally {
    activeCrawler = null;
  }

  for (const definition of operatorDefinitions) {
    if (!outcomeOperators.has(definition.name)) {
      outcomes.push({
        operator: definition.name,
        status: 'failed',
        offers: 0,
        durationMs: 0,
        mode: definition.mode,
        attempts: 0,
        error: 'Aucun résultat produit par Crawlee',
        purgeSkipped: true,
      });
    }
  }

  outcomes.sort((left, right) => left.operator.localeCompare(right.operator, 'fr'));
  const finishedAt = new Date();
  const summary: ScrapeRunSummary = {
    success: outcomes.every((outcome) => outcome.status === 'success'),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    outcomes,
  };
  latestRunSummary = summary;
  console.log(`[Crawlee] Collecte terminée en ${summary.durationMs} ms : ${outcomes.filter((o) => o.status === 'success').length}/${outcomes.length} succès.`);
  return summary;
}

async function preparePage(page: Page) {
  page.setDefaultNavigationTimeout(60_000);
  page.setDefaultTimeout(30_000);
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' });
  await page.route('**/*', async (route) => {
    const resourceType = route.request().resourceType();
    if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });
  });
}

export function validateAndNormalizePlans(
  definition: OperatorDefinition,
  rawPlans: readonly ScrapedPlan[],
): ScrapedPlan[] {
  const plans = new Map<string, ScrapedPlan>();

  for (const rawPlan of rawPlans) {
    const planName = rawPlan.planName?.replace(/\s+/g, ' ').trim();
    const network = normalizeNetwork(rawPlan.network);
    const generation = normalizeGeneration(rawPlan.networkGeneration);
    if (!planName || FORBIDDEN_OFFER_PATTERN.test(planName)) continue;
    if (!Number.isFinite(rawPlan.price) || rawPlan.price <= 0 || rawPlan.price > 200) continue;
    if (!Number.isFinite(rawPlan.dataGb) || rawPlan.dataGb <= 0 || rawPlan.dataGb > 9999) continue;
    if (!network || !definition.networks.includes(network)) continue;

    const dataEuGb = normalizeOptionalNumber(rawPlan.dataEuGb);
    if (dataEuGb != null && dataEuGb > rawPlan.dataGb) continue;

    const plan: ScrapedPlan = {
      operator: definition.name,
      planName,
      price: roundMoney(rawPlan.price),
      dataGb: rawPlan.dataGb,
      calls: rawPlan.calls?.trim() || 'Illimités',
      network,
      ...(generation ? { networkGeneration: generation } : {}),
      ...(dataEuGb != null ? { dataEuGb } : {}),
      ...copyOptionalMoney(rawPlan),
    };
    plans.set(`${planName}|||${network}`, plan);
  }

  return [...plans.values()];
}

async function enrichAndPersistPlans(
  definition: OperatorDefinition,
  page: Page | undefined,
  plans: ScrapedPlan[],
  checkoutCandidateUrls: readonly string[] = [],
  discoveredPdfUrl: string | null = null,
): Promise<{ saveErrors: number; purgeSkipped: boolean }> {
  const operatorNames = [definition.name, ...(definition.legacyNames ?? [])];
  const previousPlans = await prisma.mobilePlan.findMany({
    where: { operator: { in: operatorNames } },
  });
  const needsSimPrice = plans.some((plan) => plan.simPrice == null);
  const needsActivation = plans.some((plan) => plan.activationPrice == null);
  const needsCancellation = plans.some((plan) => plan.cancellationPrice == null);
  let checkoutFees = { simPrice: null as number | null, activationPrice: null as number | null };

  if (page && (needsSimPrice || needsActivation)) {
    checkoutFees = await detectFeesFromCheckout(page, definition.name, checkoutCandidateUrls);
  }

  let pdfFees = null;
  let webFees = null;
  if (needsCancellation || (needsSimPrice && checkoutFees.simPrice == null) || (needsActivation && checkoutFees.activationPrice == null)) {
    const pdfUrl = definition.pdfUrl ?? discoveredPdfUrl ?? null;
    if (pdfUrl) pdfFees = await fetchFeesFromPdf(pdfUrl, definition.name);
    if (definition.feeSourceUrl) webFees = await fetchFeesFromWebPage(definition.feeSourceUrl, definition.name);
  }

  for (const plan of plans) {
    plan.simPrice ??= checkoutFees.simPrice ?? pdfFees?.simPrice ?? webFees?.simPrice ?? undefined;
    plan.activationPrice ??= checkoutFees.activationPrice ?? pdfFees?.activationPrice ?? webFees?.activationPrice ?? undefined;
    plan.cancellationPrice ??= pdfFees?.cancellationPrice ?? webFees?.cancellationPrice ?? undefined;
  }

  let saveErrors = 0;
  for (const plan of plans) {
    try {
      await persistPlan(definition, plan);
    } catch (error) {
      saveErrors += 1;
      console.error(`[${definition.name}] Sauvegarde impossible pour ${plan.planName} :`, error);
    }
  }

  const existingPlans = await prisma.mobilePlan.findMany({
    where: { operator: { in: operatorNames } },
  });
  const suspiciousDrop = previousPlans.length > 0 && plans.length * 2 <= previousPlans.length;
  const purgeSkipped = saveErrors > 0 || plans.length < definition.minOffers || suspiciousDrop;

  if (purgeSkipped) {
    console.warn(`[${definition.name}] Purge ignorée (erreurs=${saveErrors}, offres=${plans.length}, précédentes=${previousPlans.length}).`);
    return { saveErrors, purgeSkipped: true };
  }

  const scrapedKeys = new Set(plans.map((plan) => `${plan.planName}|||${plan.network ?? ''}`));
  const stalePlans = existingPlans.filter((plan) =>
    plan.operator !== definition.name || !scrapedKeys.has(`${plan.planName}|||${normalizeNetwork(plan.network) ?? plan.network ?? ''}`),
  );
  for (const stalePlan of stalePlans) {
    await prisma.mobilePlan.delete({ where: { id: stalePlan.id } });
    await broadcastDeal(stalePlan, 'DELETE');
  }

  return { saveErrors, purgeSkipped: false };
}

async function persistPlan(definition: OperatorDefinition, plan: ScrapedPlan) {
  const score = plan.dataGb > 0 ? plan.price / plan.dataGb : null;
  const existing = await prisma.mobilePlan.findFirst({
    where: {
      operator: definition.name,
      planName: plan.planName,
      network: plan.network ?? null,
    },
  });
  const data = {
    price: plan.price,
    dataGb: plan.dataGb,
    calls: plan.calls || 'Illimités',
    network: plan.network,
    networkGeneration: plan.networkGeneration || null,
    dataEuGb: plan.dataEuGb ?? null,
    simPrice: plan.simPrice ?? null,
    activationPrice: plan.activationPrice ?? null,
    cancellationPrice: plan.cancellationPrice ?? null,
    url: definition.url,
    score,
  };

  if (!existing) {
    const created = await prisma.mobilePlan.create({
      data: {
        operator: definition.name,
        planName: plan.planName,
        sms: 'Illimités',
        ...data,
      },
    });
    await broadcastDeal(created, 'NEW');
    return;
  }

  const changed =
    existing.price !== data.price ||
    existing.dataGb !== data.dataGb ||
    existing.calls !== data.calls ||
    existing.networkGeneration !== data.networkGeneration ||
    existing.dataEuGb !== data.dataEuGb ||
    existing.simPrice !== data.simPrice ||
    existing.activationPrice !== data.activationPrice ||
    existing.cancellationPrice !== data.cancellationPrice;
  const updated = await prisma.mobilePlan.update({ where: { id: existing.id }, data });
  if (changed) await broadcastDeal(updated, 'UPDATE', existing);
}

function normalizeNetwork(value: string | null | undefined): MobileNetwork | null {
  const normalized = value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (!normalized) return null;
  if (normalized === 'orange') return 'Orange';
  if (normalized === 'sfr') return 'SFR';
  if (normalized === 'free' || normalized === 'free mobile') return 'Free';
  if (normalized === 'bouygues' || normalized === 'bouygues telecom') return 'Bouygues Telecom';
  return null;
}

function normalizeGeneration(value: string | undefined): '4G' | '5G' | undefined {
  if (/5g/i.test(value ?? '')) return '5G';
  if (/4g/i.test(value ?? '')) return '4G';
  return undefined;
}

function normalizeOptionalNumber(value: number | undefined): number | undefined {
  return value != null && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function copyOptionalMoney(plan: ScrapedPlan) {
  const values: Pick<ScrapedPlan, 'simPrice' | 'activationPrice' | 'cancellationPrice'> = {};
  if (plan.simPrice != null && Number.isFinite(plan.simPrice) && plan.simPrice >= 0) values.simPrice = roundMoney(plan.simPrice);
  if (plan.activationPrice != null && Number.isFinite(plan.activationPrice) && plan.activationPrice >= 0) values.activationPrice = roundMoney(plan.activationPrice);
  if (plan.cancellationPrice != null && Number.isFinite(plan.cancellationPrice) && plan.cancellationPrice >= 0) values.cancellationPrice = roundMoney(plan.cancellationPrice);
  return values;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Une page supprimée ne réapparaîtra pas en réessayant : on échoue tout de suite
 * avec un message explicite plutôt qu'un « 0/N offre(s) » trompeur.
 */
function throwIfPageGone(statusCode: number | undefined, url: string) {
  if (statusCode === 404 || statusCode === 410) {
    throw new NonRetryableError(`PAGE_INTROUVABLE_HTTP_${statusCode} : ${url} (URL de l'opérateur probablement obsolète)`);
  }
}

function isBlockedContent(html: string) {
  return html.length < 500 || BLOCKED_PAGE_PATTERN.test(html.slice(0, 250_000));
}

function splitEnvList(value: string | undefined, separator = ',') {
  return value?.split(separator).map((item) => item.trim()).filter(Boolean) ?? [];
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readNonNegativeInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

async function findTariffPdf(page: Page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const link = links.find((anchor) => /\.pdf$/i.test(anchor.href) && /(guide|tarif|prix|brochure|cgs)/i.test(`${anchor.textContent} ${anchor.href}`));
    return link?.href ?? null;
  }).catch(() => null);
}

async function findPrixtelPdf(page: Page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const link = links.find((anchor) => /\.pdf$/i.test(anchor.href) && /(prixtel_.*_gt_|guide tarifaire|fiche standardis)/i.test(`${anchor.textContent} ${anchor.href}`));
    return link?.href ?? null;
  }).catch(() => null);
}
