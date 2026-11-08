import type { ScrapedPlan, ScraperConfig } from './types';
import { extractFeesFromText, extractVisibleTextFromHtml } from './utils';

export const franceTelephoneScrapeLogic: ScraperConfig['scrapeFunction'] = async (page) => {
  try {
    const text = (await page.locator('body').innerText()).replace(/\u00a0|\u202f/g, ' ');
    return parseFranceTelephoneText(text);
  } catch (error) {
    console.error('Erreur dans la collecte France Téléphone:', error);
    return [];
  }
};

const PLAN_NAME_PATTERN = /^[A-ZÉÈÀÙÇ][A-ZÉÈÀÙÇ\s+]*$/;
const PRICE_PATTERN = /(\d{1,3})[,.](\d{2})\s*€/;
// « VITALITE1Go5G5,90 €/mois » (cartes compactes, nom avant la data)
const COMPACT_NAME_FIRST = /^([A-ZÉÈÀÙÇ][A-ZÉÈÀÙÇ+ ]*?)\s*(\d{1,4})\s*Go\s*(?:[45]G)?\s*(\d{1,3})[,.](\d{2})\s*€/;
// « 100 GoESSENTIEL14,90 € /mois » (menu, data avant le nom)
const COMPACT_DATA_FIRST = /^(\d{1,4})\s*Go\s*([A-ZÉÈÀÙÇ][A-ZÉÈÀÙÇ+ ]*?)\s*(\d{1,3})[,.](\d{2})\s*€/;

function isPlanName(line: string) {
  return PLAN_NAME_PATTERN.test(line) && line.length < 30;
}

/**
 * Lit la gamme BleuTel. Deux mises en page sont prises en charge :
 *  - cartes empilées « NOM / 100Go / 5G / … / 14,90 €/mois » (nom avant ou après la data) ;
 *  - lignes compactes « VITALITE1Go5G5,90 €/mois » ou « 100 GoESSENTIEL14,90 € /mois ».
 * Les promotions « X € pendant N mois, puis Y € » sont lissées sur douze mois.
 */
export function parseFranceTelephoneText(text: string): ScrapedPlan[] {
  const lines = text.replace(/\u00a0|\u202f/g, ' ').split('\n').map((line) => line.trim()).filter(Boolean);
  const fees = extractFeesFromText(text);
  const basePlans = new Map<string, { name: string; dataGb: number; price: number }>();

  // 1) Cartes empilées : les plus complètes (elles portent les mentions de promotion).
  for (let index = 0; index < lines.length; index += 1) {
    const dataMatch = lines[index].match(/^(\d{1,4})\s*Go$/i);
    if (!dataMatch) continue;
    const dataGb = Number.parseInt(dataMatch[1], 10);

    let name: string | undefined;
    for (let back = index - 1; back >= Math.max(0, index - 3); back -= 1) {
      if (PRICE_PATTERN.test(lines[back])) break;
      if (isPlanName(lines[back])) {
        name = lines[back];
        break;
      }
    }
    const nearby = lines.slice(index + 1, index + 16);
    name ??= nearby.slice(0, 4).find(isPlanName);
    const priceIndex = nearby.findIndex((line) => PRICE_PATTERN.test(line));
    const priceMatch = priceIndex >= 0 ? nearby[priceIndex].match(PRICE_PATTERN) : null;
    if (!name || !priceMatch || basePlans.has(name)) continue;

    const promoText = nearby.slice(priceIndex, priceIndex + 4).join(' ');
    basePlans.set(name, { name, dataGb, price: smoothPromotion(Number.parseFloat(`${priceMatch[1]}.${priceMatch[2]}`), promoText) });
  }

  // 2) Lignes compactes, pour les forfaits absents des cartes empilées.
  for (const line of lines) {
    const nameFirst = line.match(COMPACT_NAME_FIRST);
    const dataFirst = nameFirst ? null : line.match(COMPACT_DATA_FIRST);
    const name = (nameFirst?.[1] ?? dataFirst?.[2])?.trim();
    const data = nameFirst?.[2] ?? dataFirst?.[1];
    const euros = nameFirst?.[3] ?? dataFirst?.[3];
    const cents = nameFirst?.[4] ?? dataFirst?.[4];
    if (!name || !data || !isPlanName(name) || basePlans.has(name)) continue;
    basePlans.set(name, {
      name,
      dataGb: Number.parseInt(data, 10),
      price: smoothPromotion(Number.parseFloat(`${euros}.${cents}`), line),
    });
  }

  return [...basePlans.values()].flatMap((plan) => (['Orange', 'Bouygues Telecom'] as const).map((network) => ({
    operator: 'France Téléphone',
    planName: `Forfait Mobile ${plan.name} (${network})`,
    dataGb: plan.dataGb,
    price: plan.price,
    calls: 'Illimités',
    network,
    networkGeneration: '5G',
    dataEuGb: plan.dataGb,
    simPrice: fees.simPrice ?? undefined,
    activationPrice: fees.activationPrice ?? 0,
    cancellationPrice: fees.cancellationPrice ?? 0,
  })));
}

function smoothPromotion(price: number, promoText: string) {
  const recurring = promoText.match(/pendant\s+(\d+)\s*mois,?\s*puis\s+(\d{1,3})[,.](\d{2})\s*€/i);
  if (!recurring) return price;
  const promoMonths = Math.min(12, Number.parseInt(recurring[1], 10));
  const recurringPrice = Number.parseFloat(`${recurring[2]}.${recurring[3]}`);
  return Math.round(((price * promoMonths + recurringPrice * (12 - promoMonths)) / 12) * 100) / 100;
}

export const franceTelephoneHtmlScrapeLogic = (html: string) =>
  parseFranceTelephoneText(extractVisibleTextFromHtml(html));
