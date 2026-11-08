import { load } from 'cheerio';
import type { ScrapedPlan, ScraperConfig } from './types';
import { extractFeesFromText, extractVisibleTextFromHtml } from './utils';

function extractLebaraFees(text: string) {
  const fees = extractFeesFromText(text);
  if (fees.simPrice == null && /(?:carte\s*sim|eSIM)[^.;]{0,60}(?:gratuite?|offerte?|à\s*0\s*€)|sim\s+pour\s+0\s*€/i.test(text)) fees.simPrice = 0;
  if (fees.activationPrice == null && /(?:aucuns?|sans)\s+frais\s+(?:d['’]?activation|de\s+livraison)/i.test(text)) fees.activationPrice = 0;
  if (fees.cancellationPrice == null && /(?:sans\s+engagement|sans\s+frais\s+de\s+r[ée]siliation)/i.test(text)) fees.cancellationPrice = 0;
  return fees;
}

/**
 * Le catalogue Lebara est rendu côté client (React) : le HTML servi ne contient
 * pas les cartes, mais il embarque un JSON-LD schema.org « Product » par forfait
 * (nom, description, prix), qui suffit à reconstruire la gamme.
 */
export function parseLebaraStructuredData(html: string): ScrapedPlan[] {
  const $ = load(html);
  const products: Array<Record<string, unknown>> = [];
  const collect = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(collect); return; }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    const type = record['@type'];
    if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) products.push(record);
    if (record['@graph']) collect(record['@graph']);
  };
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      collect(JSON.parse($(element).text()));
    } catch {
      // JSON-LD invalide : on ignore ce bloc.
    }
  });

  const plans: ScrapedPlan[] = [];
  for (const product of products) {
    const name = String(product.name ?? '');
    const description = String(product.description ?? '').replace(/[^\S\n]+/g, ' ');
    const offer = [product.offers].flat().find((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    const dataMatch = name.match(/(\d{1,4})\s*(Go|Mo)\b/i);
    const price = Number.parseFloat(String(offer?.price ?? '').replace(',', '.'));
    const currency = String(offer?.priceCurrency ?? 'EUR').toUpperCase();
    if (!dataMatch || !Number.isFinite(price) || price <= 0 || price >= 100 || currency !== 'EUR') continue;

    const rawData = Number.parseInt(dataMatch[1], 10);
    const dataGb = dataMatch[2].toLowerCase() === 'mo' ? rawData / 1000 : rawData;
    const euMatch = description.match(/dont\s+(\d{1,3})\s*Go\s+(?:en\s+)?(?:itin[ée]rance|roaming|depuis\s+l['’]?UE|en\s+Europe)/i);
    const fees = extractLebaraFees(description);
    if (plans.some(plan => plan.dataGb === dataGb && plan.price === price)) continue;

    plans.push({
      operator: 'Lebara',
      planName: `Forfait Lebara ${dataGb >= 1 ? `${dataGb} Go` : `${rawData} Mo`}`,
      dataGb,
      price,
      calls: 'Illimités',
      network: 'SFR',
      networkGeneration: /\b5G\b/i.test(`${name} ${description}`) ? '5G' : '4G',
      dataEuGb: euMatch ? Number.parseInt(euMatch[1], 10) : undefined,
      simPrice: fees.simPrice ?? undefined,
      activationPrice: fees.activationPrice ?? undefined,
      cancellationPrice: fees.cancellationPrice ?? undefined,
    });
  }
  return plans;
}

export function parseLebaraText(rawText: string): ScrapedPlan[] {
  const text = rawText.replace(/[\u00a0\u202f]/g, ' ');
  const lines = text.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const fees = extractLebaraFees(text);

  const plans: ScrapedPlan[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const dataMatch = lines[index].match(/^(\d{1,4})\s*(Go|Mo)$/i);
    if (!dataMatch) continue;

    const contextStart = Math.max(0, index - 5);
    let contextEnd = Math.min(lines.length, index + 18);
    for (let next = index + 1; next < contextEnd; next += 1) {
      if (/^(?:offre\s+exclusive|forfait\s+mensuel|🔥)/i.test(lines[next])) {
        contextEnd = next;
        break;
      }
    }
    const context = lines.slice(contextStart, contextEnd).join('\n');
    if (!/(?:forfait\s+mensuel|nouvelle\s+souscription|appels?\/sms|renouvellement\s+tous\s+les\s+30\s+jours)/i.test(context)) continue;

    const priceText = lines.slice(index, Math.min(contextEnd, index + 7)).join(' ');
    const priceMatch = priceText.match(/(\d{1,2})[,.](\d{2})\s*€\s*(?:\/\s*)?(?:mois|month)?/i);
    if (!priceMatch) continue;

    const rawData = Number.parseInt(dataMatch[1], 10);
    const dataGb = dataMatch[2].toLowerCase() === 'mo' ? rawData / 1000 : rawData;
    const price = Number.parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
    if (dataGb <= 0 || dataGb > 1000 || price <= 0 || price >= 100) continue;

    const euMatch = context.match(/dont\s+(\d{1,3})\s*Go[^\n]{0,80}(?:UE|Europe|DOM)/i)
      ?? context.match(/(\d{1,3})\s*Go[^\n]{0,50}(?:itin[ée]rance|roaming)/i);
    const dataEuGb = euMatch ? Number.parseInt(euMatch[1], 10) : undefined;
    const networkGeneration = /\b5G\b/i.test(context) ? '5G' : '4G';

    if (!plans.some(plan => plan.dataGb === dataGb && plan.price === price)) {
      plans.push({
        operator: 'Lebara',
        planName: `Forfait Lebara ${dataGb >= 1 ? `${dataGb} Go` : `${rawData} Mo`}`,
        dataGb,
        price,
        calls: 'Illimités',
        network: 'SFR',
        networkGeneration,
        dataEuGb,
        simPrice: fees.simPrice ?? undefined,
        activationPrice: fees.activationPrice ?? undefined,
        cancellationPrice: fees.cancellationPrice ?? undefined,
      });
    }
  }

  return plans;
}

/** Retient la source la plus complète entre le texte affiché et le JSON-LD. */
function bestOf(...candidates: ScrapedPlan[][]) {
  return candidates.reduce((best, plans) => (plans.length > best.length ? plans : best), [] as ScrapedPlan[]);
}

export const lebaraHtmlScrapeLogic: NonNullable<ScraperConfig['htmlScrapeFunction']> = (html) =>
  bestOf(parseLebaraText(extractVisibleTextFromHtml(html)), parseLebaraStructuredData(html));

export const lebaraScrapeLogic: ScraperConfig['scrapeFunction'] = async (page) => {
  try {
    await page.waitForTimeout(2500);
    return bestOf(
      parseLebaraText(await page.locator('body').innerText()),
      parseLebaraStructuredData(await page.content()),
    );
  } catch (error) {
    console.error('Erreur dans la collecte Lebara:', error);
    return [];
  }
};
