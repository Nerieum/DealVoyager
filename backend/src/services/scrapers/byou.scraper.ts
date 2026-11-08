import type { Page } from 'playwright';
import type { ScraperConfig, ScrapedPlan } from './types';
import { extractFeesFromText, extractVisibleTextFromHtml } from './utils';

// En-têtes des mentions légales, ex. :
//   « Série spéciale B&YOU 20Go 5G dont 20Go valables en Europe/DOM à 9,99€/mois »
//   « Série spéciale B&You illimité 1Go (1€99/mois) »
//   « B&YOU Spécial Voyage 200Go 5G dont 40Go valables dans + de 160 destinations à 15,99€/mois »
const LEGAL_HEADER_PATTERN = /^(?:S[ée]rie\s+sp[ée]ciale\s+)?B&YOU\b/i;
// Les packs streaming (Amazon, Deezer, beIN) sont conditionnés à un abonnement tiers.
const EXCLUDED_HEADER_PATTERN = /\b(?:pack|fibre|box)\b/i;
const MONTHLY_PRICE_PATTERN = /(\d{1,3})(?:[,.](\d{2}))?\s*€\s*(\d{2})?\s*\/\s*mois/gi;

/**
 * Lit la gamme B&You depuis les mentions légales de la page « sans engagement » :
 * chaque forfait y a un en-tête (data, 4G/5G, data Europe, prix) suivi de ses frais.
 */
export function parseBAndYouText(rawText: string): ScrapedPlan[] {
    const lines = rawText.replace(/\u00a0|\u202f/g, ' ').split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const headers: Array<{ index: number; dataGb: number; price: number; generation: '4G' | '5G'; dataEuGb?: number }> = [];

    lines.forEach((line, index) => {
        if (line.length > 200 || !LEGAL_HEADER_PATTERN.test(line) || EXCLUDED_HEADER_PATTERN.test(line)) return;
        const dataMatch = line.match(/(\d{1,4})\s*(Go|Mo)\b/i);
        const priceMatch = [...line.matchAll(MONTHLY_PRICE_PATTERN)].at(-1);
        if (!dataMatch || !priceMatch) return;
        const rawData = Number.parseInt(dataMatch[1], 10);
        const dataGb = dataMatch[2].toLowerCase() === 'mo' ? rawData / 1000 : rawData;
        const price = Number.parseFloat(`${priceMatch[1]}.${priceMatch[2] ?? priceMatch[3] ?? '00'}`);
        const euMatch = line.match(/dont\s+(\d{1,4})\s*Go/i);
        headers.push({
            index,
            dataGb,
            price,
            generation: /\b5G\b/i.test(line) ? '5G' : '4G',
            dataEuGb: euMatch ? Number.parseInt(euMatch[1], 10) : undefined,
        });
    });

    const dataCounts = new Map<number, number>();
    for (const header of headers) dataCounts.set(header.dataGb, (dataCounts.get(header.dataGb) ?? 0) + 1);

    const plans = new Map<string, ScrapedPlan>();
    headers.forEach((header, position) => {
        const blockEnd = Math.min(headers[position + 1]?.index ?? lines.length, header.index + 12);
        const block = lines.slice(header.index, blockEnd).join('\n');
        const fees = extractFeesFromText(block);
        const dataEuGb = header.dataEuGb
            ?? (() => {
                const match = block.match(/dont\s+(\d{1,4})\s*Go\s+utilisables?/i);
                return match ? Number.parseInt(match[1], 10) : undefined;
            })();
        const dataLabel = header.dataGb >= 1 ? `${header.dataGb} Go` : `${header.dataGb * 1000} Mo`;
        // Deux forfaits peuvent partager la même data (ex. 20 Go 4G et 20 Go 5G).
        const planName = (dataCounts.get(header.dataGb) ?? 0) > 1
            ? `Forfait B&You ${dataLabel} ${header.generation}`
            : `Forfait B&You ${dataLabel}`;
        if (plans.has(planName)) return;
        plans.set(planName, {
            operator: 'B&You',
            planName,
            dataGb: header.dataGb,
            price: header.price,
            calls: 'Illimités',
            network: 'Bouygues Telecom',
            networkGeneration: header.generation,
            dataEuGb: dataEuGb != null && dataEuGb <= header.dataGb ? dataEuGb : undefined,
            simPrice: fees.simPrice ?? undefined,
            activationPrice: fees.activationPrice ?? undefined,
            cancellationPrice: fees.cancellationPrice ?? undefined,
        });
    });

    return [...plans.values()];
}

export const bAndYouHtmlScrapeLogic: NonNullable<ScraperConfig['htmlScrapeFunction']> = (html) =>
    parseBAndYouText(extractVisibleTextFromHtml(html, { includeHidden: true }));

export const bAndYouScrapeLogic: ScraperConfig['scrapeFunction'] = async (page) => {
    try {
        const plans = parseBAndYouText(extractVisibleTextFromHtml(await page.content(), { includeHidden: true }));
        if (plans.length > 0) return plans;
    } catch (error) {
        console.warn('[B&You] Lecture des mentions légales impossible, repli sur les clics :', error);
    }
    return legacyBAndYouScrape(page);
};

async function legacyBAndYouScrape(page: Page): Promise<ScrapedPlan[]> {
    try {
        await new Promise(r => setTimeout(r, 5000));

        // ─── Fermer bannière cookies ───
        try {
            const acceptBtn = await page.$(
                '#popin_tc_privacy_button_2, #didomi-notice-agree-button, button[id*="accept"]',
            );
            if (acceptBtn) {
                await acceptBtn.click();
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch { }

        // ─── Scroller pour charger tout le contenu ───
        await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(r => setTimeout(r, 800));
            }
        });

        // ─── Ouvrir la modale Mentions Légales pour extraire les frais ───
        try {
            await page.evaluate(() => {
                const triggers = Array.from(document.querySelectorAll('button, a, div[role="button"], span'))
                    .filter(el => {
                        const t = (el.textContent || '').toLowerCase().trim();
                        return (t.includes('mentions l') || t.includes('voir les d') || t.includes('afficher plus'));
                    });
                for (const btn of triggers) {
                    try { (btn as HTMLElement).click(); } catch { }
                }
            });
            await new Promise(r => setTimeout(r, 2000));
        } catch { }
        await new Promise(r => setTimeout(r, 2000));

        // ─── Extraction des frais via la fonction centralisée ───
        const pageText = await page.evaluate(() => (document.body.innerText || ''));
        const fees = extractFeesFromText(pageText);

        console.log(
            `[B&You] Frais extraits - SIM: ${fees.simPrice}€, activation: ${fees.activationPrice}€, résiliation: ${fees.cancellationPrice}€`,
        );

        // ─── Récupérer les options de forfait disponibles ───
        // B&You utilise des boutons radio pour sélectionner le volume data
        const optionTexts = await page.evaluate(() => {
            // Sélecteurs actuels : boutons avec texte data (2h 1Go, 5Go, 150Go, 200Go)
            const selectors = [
                'button.is-label-check',
                'label.radio-label',
                'label[class*="radio"]',
                'label',
            ];

            const results: string[] = [];
            for (const sel of selectors) {
                const els = document.querySelectorAll(sel);
                for (const el of Array.from(els)) {
                    const text = (el.textContent || '').trim();
                    if (/\d+\s*(Go|Mo)/i.test(text) && text.length < 50) {
                        if (!results.includes(text)) results.push(text);
                    }
                }
                if (results.length > 0) break;
            }
            return results;
        });

        const plans: ScrapedPlan[] = [];

        for (const optText of optionTexts) {
            try {
                // ─── Extraire le volume data du label ───
                const dataMatch = optText.match(/(\d{1,4})\s*(Go|Mo)/i);
                if (!dataMatch) continue;
                const rawData = parseInt(dataMatch[1], 10);
                const unit = dataMatch[2].toLowerCase();
                const dataGb = unit === 'mo' ? rawData / 1000 : rawData;

                let specificCalls = 'Illimités';
                const callMatch = optText.match(/(\d+)h/i);
                if (callMatch) specificCalls = `${callMatch[1]}h`;

                // ─── Cliquer sur l'option ───
                await page.evaluate((targetText: string) => {
                    const selectors = ['button.is-label-check', 'label.radio-label', 'label[class*="radio"]', 'label'];
                    for (const sel of selectors) {
                        const els = document.querySelectorAll(sel);
                        for (const el of Array.from(els)) {
                            if ((el.textContent || '').trim() === targetText) {
                                (el as HTMLElement).click();
                                return;
                            }
                        }
                    }
                }, optText);
                await new Promise(r => setTimeout(r, 2000));

                // ─── Lire le prix et les infos du forfait sélectionné ───
                const planData = await page.evaluate((selectedDataGb: number) => {
                    // Stratégie 1 : sticky bar "Votre sélection" en bas de page
                    const stickyBars = document.querySelectorAll(
                        '[class*="sticky"], [class*="bottom"], [class*="selection"], [class*="recap"]'
                    );
                    for (const bar of Array.from(stickyBars)) {
                        const text = (bar.textContent || '').replace(/\u00a0/g, ' ');
                        const pm = text.match(/(\d{1,3})[,.]\s*(\d{2})\s*€\s*\/?\s*mois/i);
                        if (pm) {
                            return { price: parseFloat(`${pm[1]}.${pm[2]}`) };
                        }
                    }

                    // Stratégie 2 : plus gros prix par font-size (carte bleue principale)
                    let bestPrice = 0;
                    let biggestFs = 0;
                    for (const el of Array.from(document.querySelectorAll('*'))) {
                        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                        if (text.length > 30) continue;
                        const pm = text.match(/^(\d{1,3})[,.]\s*(\d{2})\s*€?$/);
                        if (!pm) continue;
                        const fs = parseFloat(window.getComputedStyle(el).fontSize);
                        if (fs > biggestFs) {
                            biggestFs = fs;
                            bestPrice = parseFloat(`${pm[1]}.${pm[2]}`);
                        }
                    }
                    if (bestPrice > 0) return { price: bestPrice };

                    // Stratégie 3 : dernier "X,XX€/mois" dans le body
                    const bodyText = document.body.innerText;
                    const allPrices = bodyText.match(/(\d{1,3})[,.]\s*(\d{2})\s*€\s*\/?\s*mois/gi);
                    if (allPrices && allPrices.length > 0) {
                        const last = allPrices[allPrices.length - 1];
                        const m = last.match(/(\d{1,3})[,.]\s*(\d{2})/);
                        if (m) return { price: parseFloat(`${m[1]}.${m[2]}`) };
                    }

                    return { price: 0 };
                }, dataGb);

                if (planData.price <= 0 || plans.some(p => p.dataGb === dataGb)) continue;

                // ─── Détection 5G ───
                const has5G = await page.evaluate((dGb: number) => {
                    const rgx = new RegExp(`\\b${dGb}\\s*Go`, 'i');
                    // Chercher dans les éléments textuels proches du forfait
                    for (const el of Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,span,p,div,label,strong,b,img'))) {
                        if (el.tagName === 'IMG') {
                            const attrs = `${el.getAttribute('alt') || ''} ${el.getAttribute('src') || ''}`;
                            if (!/5g/i.test(attrs)) continue;
                            let p: Element | null = el.parentElement;
                            for (let d = 0; d < 8 && p; d++, p = p.parentElement) {
                                if ((p.textContent || '').length < 300 && rgx.test(p.textContent || '')) return true;
                            }
                        } else {
                            const t = (el.textContent || '').trim();
                            if (t.length < 3 || t.length > 100) continue;
                            if (rgx.test(t) && /\b5g\b/i.test(t)) return true;
                        }
                    }
                    return false;
                }, dataGb);

                // ─── Détection data EU ───
                const euGb = await page.evaluate((selectedDataGb: number) => {
                    const text = document.body.innerText;
                    const selected = text.match(/Qualit[ée] du r[ée]seau Bouygues Telecom\s+(\d{1,3})\s*[Gg]o\s*utilisables?/i);
                    if (selected) {
                        const value = parseInt(selected[1], 10);
                        if (value > 0 && value <= selectedDataGb) return value;
                    }
                    const matches = Array.from(text.matchAll(/(\d{1,3})\s*[Gg]o\s*utilisables?\s*(?:en|dans)\s*(?:l['’])?[Ee]urop/gi))
                        .map((match) => parseInt(match[1], 10))
                        .filter((value) => value > 0 && value <= selectedDataGb);
                    return matches.length > 0 ? matches[matches.length - 1] : (selectedDataGb <= 20 ? selectedDataGb : 0);
                }, dataGb);

                const gen = has5G || /\b5g\b/i.test(optText) ? '5G' : '4G';
                const planName = `Forfait B&You ${dataGb >= 1 ? dataGb + ' Go' : dataGb * 1000 + ' Mo'}`;

                plans.push({
                    planName,
                    dataGb,
                    price: planData.price,
                    calls: specificCalls,
                    operator: 'B&You',
                    network: 'Bouygues Telecom',
                    networkGeneration: gen,
                    dataEuGb: euGb || undefined,
                    simPrice: fees.simPrice ?? undefined,
                    activationPrice: fees.activationPrice ?? undefined,
                    cancellationPrice: fees.cancellationPrice ?? undefined,
                });
            } catch (err) {
                console.warn('[B&You] Erreur sur une option:', err);
            }
        }

        // ─── Fallback textuel si aucun plan trouvé via les clics ───
        if (plans.length === 0) {
            console.log('[B&You] Fallback extraction textuelle...');
            const fallbackPlans = await page.evaluate(() => {
                const results: { planName: string; dataGb: number; price: number; calls: string; networkGeneration: string }[] = [];
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                for (let i = 0; i < lines.length; i++) {
                    const dataMatch = lines[i].match(/^(?:(\d+)h\s*)?(\d{1,4})\s*(Go|Mo)\s*$/i);
                    if (!dataMatch) continue;
                    const hoursRaw = dataMatch[1];
                    const rawData = parseInt(dataMatch[2], 10);
                    const unit = dataMatch[3].toLowerCase();
                    const dataGb = unit === 'mo' ? rawData / 1000 : rawData;
                    if (dataGb <= 0) continue;

                    let calls = hoursRaw ? `${hoursRaw}h` : 'Illimités';

                    for (let j = Math.max(0, i - 15); j < Math.min(lines.length, i + 15); j++) {
                        const cleanLine = lines[j].replace(/\u00a0/g, ' ').trim();
                        const priceMatch = cleanLine.match(/(\d{1,3})[,.]\s*(\d{2})\s*€/);
                        if (priceMatch) {
                            const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
                            if (price > 0 && price < 80 && !results.some(r => r.dataGb === dataGb)) {
                                const nearbyText = lines.slice(Math.max(0, i - 5), i + 15).join(' ');
                                const gen = /\b5g\b/i.test(nearbyText) ? '5G' : '4G';
                                results.push({
                                    planName: `Forfait B&You ${dataGb >= 1 ? dataGb + ' Go' : dataGb * 1000 + ' Mo'}`,
                                    dataGb, price, calls, networkGeneration: gen,
                                });
                            }
                            break;
                        }
                    }
                }
                return results;
            });

            for (const p of fallbackPlans) {
                plans.push({
                    ...p,
                    operator: 'B&You',
                    network: 'Bouygues Telecom',
                    dataEuGb: undefined,
                    simPrice: fees.simPrice ?? undefined,
                    activationPrice: fees.activationPrice ?? undefined,
                    cancellationPrice: fees.cancellationPrice ?? undefined,
                });
            }
        }

        return plans.filter(p => p.price > 0 && p.dataGb > 0);
    } catch (error) {
        console.error('Erreur dans la collecte B&You:', error);
        return [];
    }
}
