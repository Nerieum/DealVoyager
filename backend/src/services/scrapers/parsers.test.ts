import assert from 'node:assert/strict';
import test from 'node:test';
import { operatorDefinitions, validateAndNormalizePlans } from '../scraper.service';
import { parseAkeoText } from './akeo.scraper';
import { parseFranceTelephoneText } from './francetelephone.scraper';
import { discoverFreePlanUrls } from './free.scraper';
import { parseBAndYouText } from './byou.scraper';
import { parseLebaraStructuredData, parseLebaraText } from './lebara.scraper';
import { parseSymaText } from './syma.scraper';
import { parseTelecoopText } from './telecoop.scraper';
import { extractCheckoutCandidateUrls, extractCheckoutFeesFromText, extractFeesFromPdfText, extractFeesFromText, extractTariffPdfUrl, extractVisibleTextFromHtml } from './utils';

test('le registre contient 18 opérateurs uniques et complets', () => {
  assert.equal(operatorDefinitions.length, 18);
  assert.equal(new Set(operatorDefinitions.map((definition) => definition.name)).size, 18);
  for (const definition of operatorDefinitions) {
    assert.ok(definition.url.startsWith('https://'));
    assert.ok(definition.networks.length > 0);
    assert.ok(definition.minOffers > 0);
  }
});

test('les 18 opérateurs sont associés à leurs réseaux MNO', () => {
  const expectedNetworks = new Map<string, readonly string[]>([
    ['Sosh', ['Orange']],
    ['RED by SFR', ['SFR']],
    ['B&You', ['Bouygues Telecom']],
    ['Free Mobile', ['Free']],
    ['YouPrice', ['Orange', 'SFR', 'Bouygues Telecom']],
    ['Coriolis', ['SFR']],
    ['La Poste Mobile', ['Bouygues Telecom']],
    ['NRJ Mobile', ['Bouygues Telecom']],
    ['Auchan Telecom', ['Bouygues Telecom']],
    ['Cdiscount Mobile', ['Bouygues Telecom']],
    ['Syma Mobile', ['SFR']],
    ['Lebara', ['SFR']],
    ['Lycamobile', ['Bouygues Telecom']],
    ['Prixtel', ['SFR']],
    ['TeleCoop', ['Orange']],
    ['Akeo Telecom', ['Orange', 'Bouygues Telecom']],
    ['Nordnet', ['Orange']],
    ['France Téléphone', ['Orange', 'Bouygues Telecom']],
  ]);

  assert.equal(expectedNetworks.size, operatorDefinitions.length);
  for (const definition of operatorDefinitions) {
    assert.deepEqual(definition.networks, expectedNetworks.get(definition.name), definition.name);
  }
});

test('la validation normalise les réseaux et retire les produits parasites', () => {
  const definition = operatorDefinitions.find((item) => item.name === 'B&You');
  assert.ok(definition);
  const plans = validateAndNormalizePlans(definition, [
    { operator: 'faux', planName: 'Forfait 100 Go', price: 9.999, dataGb: 100, network: 'Bouygues', networkGeneration: '5g', dataEuGb: 30 },
    { operator: 'faux', planName: 'Box 4G 100 Go', price: 9.99, dataGb: 100, network: 'Bouygues' },
    { operator: 'faux', planName: 'Forfait 20 Go engagement 12 mois', price: 5, dataGb: 20, network: 'Bouygues' },
    { operator: 'faux', planName: 'Forfait impossible', price: Number.NaN, dataGb: 20, network: 'Bouygues' },
  ]);
  assert.deepEqual(plans, [{
    operator: 'B&You',
    planName: 'Forfait 100 Go',
    price: 10,
    dataGb: 100,
    calls: 'Illimités',
    network: 'Bouygues Telecom',
    networkGeneration: '5G',
    dataEuGb: 30,
  }]);
});

test('France Téléphone ignore les box et moyenne les promotions sur douze mois', () => {
  const plans = parseFranceTelephoneText(`
    5 forfaits BleuTel
    100 Go
    ESSENTIEL
    Appels, SMS & MMS illimités
    12,90 €
    /mois
    pendant 3 mois, puis 14,90 €/mois
    DÉCOUVREZ AUSSI
    BleuBox 200 Go 24,90 €
  `);
  assert.equal(plans.length, 2);
  assert.equal(plans[0].price, 14.4);
  assert.equal(plans[0].operator, 'France Téléphone');
  assert.deepEqual(plans.map((plan) => plan.network), ['Orange', 'Bouygues Telecom']);
});

test('France Téléphone lit la nouvelle page (nom avant la data, lignes compactes)', () => {
  const plans = parseFranceTelephoneText(`
    Nos forfaits mobiles
    1 GoVITALITE5,90 € /mois
    100 GoESSENTIEL14,90 € /mois
    Choisissez votre forfait BleuTel
    Le plus choisi5G
    ESSENTIEL
    100Go
    14,90 €/mois
    VITALITE1Go5G5,90 €/mois
    PRIVILEGE20Go5G9,90 €/mois
    OPTIMAL+200Go5G24,90 €/mois
    OPTIMAL
    150Go
    5G
    Appels illimités · Europe & DOM · Engagement : zéro
    19,90 €/mois
    Forfait fixe BleuFix
    19,90 €/mois
  `);
  const byName = new Map(plans.filter((plan) => plan.network === 'Orange').map((plan) => [plan.planName, [plan.dataGb, plan.price]]));
  assert.deepEqual(Object.fromEntries(byName), {
    'Forfait Mobile ESSENTIEL (Orange)': [100, 14.9],
    'Forfait Mobile OPTIMAL (Orange)': [150, 19.9],
    'Forfait Mobile VITALITE (Orange)': [1, 5.9],
    'Forfait Mobile PRIVILEGE (Orange)': [20, 9.9],
    'Forfait Mobile OPTIMAL+ (Orange)': [200, 24.9],
  });
  assert.equal(plans.length, 10);
});

test('B&You lit la gamme dans les mentions légales et exclut packs et fibre', () => {
  const plans = parseBAndYouText(`
    B&YOU Pure fibre : offre valable à partir du 26/01/26. Frais de mise en service : 48€ frais de résiliation : 69€. 24,99€/mois.
    Série spéciale B&You illimité 1Go (1€99/mois)
    Carte SIM à 1€
    Frais d’activation à 1€ (à payer sur la 1ère facture seulement)
    Frais de résiliation : 5€.
    1Go en France métropolitaine dont 1Go utilisables en Europe/DOM.
    Série spéciale B&YOU 20Go 5G dont 20Go valables en Europe/DOM à 9,99€/mois
    SIM à 1€. Frais d’activation à 1€. Frais de résiliation : 5€.
    Série spéciale B&YOU 20Go 4G dont 20Go valables en Europe/DOM à 8,99€/mois
    SIM à 1€. Frais d’activation à 1€. Frais de résiliation : 5€.
    B&YOU Pack Amazon Prime 170Go 5G dont 60Go en Europe/DOM à 17,99€/mois
    Carte SIM à 1€
    Série spéciale B&YOU 300Go 5G dont 40Go valables dans + de 160 destinations à 19€99/mois
    Carte SIM à 1€. Frais d’activation à 1€. Frais de résiliation : 5€
  `);
  assert.deepEqual(plans.map((plan) => [plan.planName, plan.dataGb, plan.price, plan.networkGeneration, plan.dataEuGb]), [
    ['Forfait B&You 1 Go', 1, 1.99, '4G', 1],
    ['Forfait B&You 20 Go 5G', 20, 9.99, '5G', 20],
    ['Forfait B&You 20 Go 4G', 20, 8.99, '4G', 20],
    ['Forfait B&You 300 Go', 300, 19.99, '5G', 40],
  ]);
  assert.ok(plans.every((plan) => plan.simPrice === 1 && plan.activationPrice === 1 && plan.cancellationPrice === 5));
});

test('Lebara lit les forfaits dans le JSON-LD schema.org quand la page est rendue en JS', () => {
  const products = [
    { '@type': 'Product', name: 'Forfait 30 Go', description: "Réseau 4G/4G+,Dont 10Go en itinérance depuis l'UE et les DOM,La Carte SIM est gratuite,Flexible et sans engagement", offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '7.99' } },
    { '@type': 'Product', name: 'Forfait 200 Go 5G', description: "5G incluse,Dont 15 Go en itinérance depuis l'UE et les DOM,La SIM / eSIM est gratuite,Flexible et sans engagement", offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '9.99' } },
  ];
  const html = `<html><body><div id="root"></div>
    <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[]}</script>
    <script type="application/ld+json">${JSON.stringify(products)}</script>
    <script type="application/ld+json">{invalide</script></body></html>`;
  const plans = parseLebaraStructuredData(html);
  assert.deepEqual(plans.map((plan) => [plan.planName, plan.dataGb, plan.price, plan.networkGeneration, plan.dataEuGb]), [
    ['Forfait Lebara 30 Go', 30, 7.99, '4G', 10],
    ['Forfait Lebara 200 Go', 200, 9.99, '5G', 15],
  ]);
  assert.ok(plans.every((plan) => plan.simPrice === 0 && plan.cancellationPrice === 0));
});

test('Free découvre les forfaits depuis les liens sans routes prédéfinies', () => {
  const urls = discoverFreePlanUrls('https://mobile.free.fr/', [
    { href: '/une-offre-mobile', text: 'Forfait principal' },
    { href: '/serie-speciale', text: 'Série du moment' },
    { href: '/assistance', text: 'Assistance' },
  ]);
  assert.deepEqual(urls, [
    'https://mobile.free.fr/une-offre-mobile',
    'https://mobile.free.fr/serie-speciale',
  ]);
});

test("le checkout ne confond pas l'activation de la SIM avec des frais d'activation", () => {
  assert.deepEqual(extractCheckoutFeesFromText('Activation SIM : 10 €'), {
    simPrice: 10,
    activationPrice: null,
  });
  assert.deepEqual(extractCheckoutFeesFromText('Carte SIM 1,99 € - Frais de souscription : 5 €'), {
    simPrice: 1.99,
    activationPrice: 5,
  });
  assert.deepEqual(extractCheckoutFeesFromText('Carte SIM / eSIM Frais d’activation 10,00 € Total 10,00 €'), {
    simPrice: null,
    activationPrice: 10,
  });
  assert.deepEqual(extractCheckoutFeesFromText('Forfait 7,99 € / mois TYPE CARTE SIM Carte SIM triple découpe Frais d’activation 10,00 €'), {
    simPrice: null,
    activationPrice: 10,
  });
});

test('les frais reconnaissent les libellés réellement publiés par les opérateurs', () => {
  assert.deepEqual(
    extractFeesFromText('Carte SIM à 1€ Frais d’activation à 1€ Frais de résiliation : 5€. Sans engagement.'),
    { simPrice: 1, activationPrice: 1, cancellationPrice: 5 },
  );
  assert.equal(
    extractFeesFromText("La carte SIM est facturée 9,90€ le jour de la souscription.").simPrice,
    9.9,
  );
  assert.equal(extractFeesFromText('SIM/eSIM : 10€ (à la commande)').simPrice, 10);
  assert.equal(extractFeesFromText('10 euros pour la carte SIM lors de la commande').simPrice, 10);
  assert.equal(extractFeesFromText('SIM/eSIM offerte au lieu de 10€').simPrice, 0);
});

test('les brochures PDF reconnaissent SIM/eSIM et les apostrophes typographiques', () => {
  assert.deepEqual(
    extractFeesFromPdfText("SIM/eSIM : 10€ à la commande\nFrais d’activation : 1 euro\nFrais de résiliation : 5 euros"),
    { simPrice: 10, activationPrice: 1, cancellationPrice: 5 },
  );
});

test('les liens de souscription excluent les espaces client et les pages éditoriales', () => {
  assert.deepEqual(extractCheckoutCandidateUrls('https://operateur.test/forfaits', [
    { href: '/commande/offre-100-go', text: 'Je souscris' },
    { href: '/espace-client/connexion', text: 'Continuer' },
    { href: '/assistance/choisir', text: 'Choisir son forfait' },
    { href: 'https://client.operateur.test/', text: 'Souscrire depuis mon espace client' },
    { href: '/choisir-son-forfait', text: 'Choisir son forfait' },
    { href: '/suivi-de-commande.html', text: 'Suivi de commande' },
  ]), ['https://operateur.test/commande/offre-100-go']);
});

test('la brochure tarifaire est mémorisée avant de quitter le catalogue', () => {
  assert.equal(extractTariffPdfUrl('https://operateur.test/forfaits', [
    { href: '/mentions.pdf', text: 'Mentions légales' },
    { href: '/documents/brochure-tarifaire.pdf?version=2026', text: 'Brochure tarifaire' },
  ]), 'https://operateur.test/documents/brochure-tarifaire.pdf?version=2026');
  assert.equal(extractTariffPdfUrl('https://operateur.test/forfaits', [
    { href: '/documents/offre.pdf', text: 'Récapitulatif contractuel' },
  ]), 'https://operateur.test/documents/offre.pdf');
});

test('Syma associe les colonnes prix, data et Europe sans lire les options', () => {
  const plans = parseSymaText(`
    SANS ENGAGEMENT
    7
    €99
    /MOIS
    9
    €99
    /MOIS
    illimités
    illimités
    10 Go
    10 Go
    CHOISIR
    illimités
    illimités
    100 Go
    32 Go
    CHOISIR
    Options
    100 Go
    10€
  `);
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((plan) => [plan.dataGb, plan.price, plan.dataEuGb]), [[10, 7.99, 10], [100, 9.99, 32]]);
});

test('Lebara lit le catalogue nouveaux clients et ses frais gratuits', () => {
  const plans = parseLebaraText(`
    Forfaits mobiles sans engagement
    La carte SIM et la livraison sont offertes !
    Offre exclusive nouvelle souscription
    Forfait Mensuel 50Go
    50Go
    5,99 €
    / Mois
    Appels/SMS illimités vers la France
    Réseau 4G/4G+
    Dont 7Go depuis l'UE/ DOM
    Sans engagement
    Forfait Mensuel 250Go 5G
    250Go
    8,99 €
    / Mois
    Appels/SMS illimités vers la France
    5G incluse !
    Dont 7Go depuis l'UE/ DOM
    Sans engagement
  `);
  assert.deepEqual(plans.map(plan => [plan.dataGb, plan.price, plan.dataEuGb, plan.networkGeneration]), [
    [50, 5.99, 7, '4G'],
    [250, 8.99, 7, '5G'],
  ]);
  assert.ok(plans.every(plan => plan.simPrice === 0 && plan.cancellationPrice === 0));
});

test('TeleCoop développe les paliers fixes et exclut la facturation au Go', () => {
  const plans = parseTelecoopText('Forfait Engagé Forfait Sobriété Forfait Transition sans engagement');
  assert.equal(plans.length, 5);
  assert.ok(plans.every((plan) => !/Sobriété/i.test(plan.planName)));
});

test('Akeo retient le tarif sans réengagement sur ses deux réseaux', () => {
  const plans = parseAkeoText(`
    INFINITY
    Orange 19 € 99 / mois Engagement 12 mois 19,99 € / mois en cas de ré-engagement ou 21,99 € / mois 4G
    Bouygues Telecom 18 € 99 / mois Engagement 12 mois 18,99 € / mois en cas de ré-engagement ou 20,99 € / mois 5G
    350 Go d'internet mobile 4G ou 5G en France métropolitaine, dont 50 Go utilisables en Europe
    ULTRA
  `);
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((plan) => plan.price), [21.99, 20.99]);
});

test('le texte HTML retire scripts et éléments cachés', () => {
  const text = extractVisibleTextFromHtml('<body><article>Offre 100 Go</article><div hidden>Ancienne offre 20 Go</div><script>prix=1</script></body>');
  assert.match(text, /Offre 100 Go/);
  assert.doesNotMatch(text, /Ancienne|prix=1/);
});
