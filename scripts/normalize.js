#!/usr/bin/env node
/**
 * scripts/normalize.js
 * Fusionne les fichiers scraping bruts dans public/products.json.
 * Applique les marges, génère les slugs, déduplique par id.
 *
 * Usage :
 *   node scripts/normalize.js                        → fusionne tout
 *   node scripts/normalize.js --source aliexpress    → seulement AliExpress
 *   node scripts/normalize.js --dry-run              → affiche sans écrire
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const SCRAPED_DIR   = path.join(__dirname, '../data/scraped');
const OUTPUT_FILE   = path.join(__dirname, '../public/products.json');

// Marge identique à src/utils/margins.js (duplication volontaire côté Node)
const MARGIN_BY_CATEGORY = {
  'Smartphones':        1.18,
  'Tablettes':          1.20,
  'Informatique':       1.22,
  'Audio':              1.38,
  'Montres connectées': 1.35,
  'Accessoires':        1.55,
  'Gadgets':            1.60,
  'default':            1.35,
};
const MARGIN_BY_PRICE = [
  { max: 10,       coeff: 1.70 },
  { max: 30,       coeff: 1.55 },
  { max: 60,       coeff: 1.40 },
  { max: 120,      coeff: 1.30 },
  { max: 300,      coeff: 1.22 },
  { max: Infinity, coeff: 1.15 },
];

function computePrice(supplierPrice, category) {
  let coeff = MARGIN_BY_CATEGORY[category];
  if (!coeff) {
    const b = MARGIN_BY_PRICE.find(b => supplierPrice <= b.max);
    coeff = b?.coeff ?? 1.35;
  }
  return Math.floor(supplierPrice * coeff) + 0.99;
}

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Normalisation d'un produit brut scraping ──────────────────────────────────
function normalizeProduct(raw, source) {
  const supplierPrice = parseFloat(raw.supplier_price || raw.price_raw || 0);
  if (!supplierPrice || isNaN(supplierPrice)) {
    console.warn(`⚠  Prix manquant pour : ${raw.name} — ignoré`);
    return null;
  }

  const category = raw.category || 'Divers';
  const coeff    = MARGIN_BY_CATEGORY[category] ?? 1.35;

  return {
    // ── Champs publics ─────────────────────────────────────────────────────
    id:               raw.id || `${source}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name:             (raw.name || '').trim(),
    slug:             raw.slug || slugify(raw.name),
    description:      (raw.description || '').slice(0, 200),
    description_full: raw.description_full || raw.description || '',
    image:            raw.image || '',
    gallery:          raw.gallery || [],
    category,
    subcategory:      raw.subcategory || '',
    brand:            raw.brand || '',
    available:        raw.available ?? ((raw.stock ?? 1) > 0),
    stock:            raw.stock ?? null,
    badge:            raw.badge || null,
    // ── Champs internes (strippés côté client par products.js) ────────────
    supplier_price:   supplierPrice,
    source,
    source_url:       raw.source_url || raw.url || '',
    scraped_at:       raw.scraped_at || new Date().toISOString(),
    margin_applied:   coeff,
    internal_id:      raw.internal_id || raw.sku || '',
  };
}

// ── Lecture des fichiers scraping ──────────────────────────────────────────────
function loadScraped(filterSource) {
  if (!fs.existsSync(SCRAPED_DIR)) {
    console.log('📂 Dossier data/scraped/ absent — aucun fichier scraping à fusionner.');
    return [];
  }

  const files = fs.readdirSync(SCRAPED_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !filterSource || f.startsWith(filterSource));

  const results = [];
  for (const file of files) {
    const source = file.split('-')[0]; // "aliexpress-smartphones.json" → "aliexpress"
    try {
      const raw  = JSON.parse(fs.readFileSync(path.join(SCRAPED_DIR, file), 'utf-8'));
      const data = Array.isArray(raw) ? raw : raw.products || [];
      const normalized = data.map(p => normalizeProduct(p, source)).filter(Boolean);
      console.log(`✅ ${file} → ${normalized.length} produits normalisés`);
      results.push(...normalized);
    } catch (e) {
      console.error(`❌ Erreur lecture ${file} : ${e.message}`);
    }
  }
  return results;
}

// ── Fusion avec déduplification ────────────────────────────────────────────────
function merge(existing, incoming) {
  const map = new Map(existing.map(p => [p.id, p]));
  let added = 0, updated = 0;
  for (const p of incoming) {
    if (map.has(p.id)) { updated++; } else { added++; }
    map.set(p.id, p);
  }
  console.log(`📊 Ajoutés: ${added} · Mis à jour: ${updated} · Total: ${map.size}`);
  return [...map.values()];
}

// ── Main ────────────────────────────────────────────────────────────────────────
(function main() {
  const args       = process.argv.slice(2);
  const dryRun     = args.includes('--dry-run');
  const srcIdx     = args.indexOf('--source');
  const filterSrc  = srcIdx !== -1 ? args[srcIdx + 1] : null;

  // Charge l'existant
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')); }
    catch { existing = []; }
  }
  console.log(`📦 Produits existants : ${existing.length}`);

  // Charge le scraping
  const incoming = loadScraped(filterSrc);
  if (!incoming.length) {
    console.log('ℹ  Aucun nouveau produit à intégrer.');
    return;
  }

  const merged = merge(existing, incoming);

  if (dryRun) {
    console.log('🔍 DRY RUN — aucune écriture. Aperçu :');
    console.log(JSON.stringify(merged.slice(0, 2), null, 2));
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`✅ products.json mis à jour → ${merged.length} produits`);
})();
