#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const FILES = [
  path.join(__dirname, '..', 'data', 'scraped', 'pixmania-smartphones.json'),
  path.join(__dirname, '..', 'data', 'scraped', 'pixmania-tablettes.json'),
  path.join(__dirname, '..', 'data', 'scraped', 'pixmania-audio.json'),
  path.join(__dirname, '..', 'data', 'scraped', 'pixmania-accessoires.json'),
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function inferBrand(name = '', html = '') {
  const text = `${name} ${html}`.toLowerCase();

  const brands = [
    'apple', 'samsung', 'xiaomi', 'redmi', 'poco', 'oneplus', 'google',
    'pixel', 'motorola', 'huawei', 'honor', 'realme', 'lenovo', 'microsoft',
    'jbl', 'sony', 'bose', 'sennheiser', 'shokz', 'marshall', 'lg',
    'hisense', 'thomson', 'nothing', 'bowers & wilkins', 'bowers and wilkins',
    'ultimate ears', 'dcu', 'panzerglass', 'bmw', 'accezz', 'imoshion', 'jaym', 'tcl'
  ];

  for (const brand of brands) {
    if (text.includes(brand)) {
      switch (brand) {
        case 'pixel': return 'Google';
        case 'redmi': return 'Xiaomi';
        case 'poco': return 'Xiaomi';
        case 'bowers and wilkins': return 'Bowers & Wilkins';
        default:
          return brand
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
      }
    }
  }

  return '';
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function normalizeText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCondition(text) {
  const t = text.toLowerCase();

  if (/(reconditionn[eé].{0,40}excellent état|excellent état.{0,40}reconditionn[eé])/.test(t)) {
    return 'Reconditionné en excellent état';
  }
  if (/(reconditionn[eé].{0,40}tr[eè]s bon état|tr[eè]s bon état.{0,40}reconditionn[eé])/.test(t)) {
    return 'Reconditionné en très bon état';
  }
  if (/(reconditionn[eé].{0,40}bon état|bon état.{0,40}reconditionn[eé])/.test(t)) {
    return 'Reconditionné en bon état';
  }
  if (/reconditionn[eé]/.test(t)) {
    return 'Reconditionné';
  }
  if (/\bneuf\b/.test(t)) {
    return 'Neuf';
  }

  return '';
}

function extractWarranty(text) {
  const t = text.toLowerCase();

  let m = t.match(/garantie\s*(\d{1,2})\s*mois/);
  if (m) return `Garantie ${m[1]} mois`;

  m = t.match(/(\d{1,2})\s*mois\s*de\s*garantie/);
  if (m) return `Garantie ${m[1]} mois`;

  m = t.match(/garanti[e]?\s*(\d{1,2})\s*mois/);
  if (m) return `Garantie ${m[1]} mois`;

  return '';
}

function extractDescription(html, fallback = '') {
  const desc =
    extractMeta(html, 'description') ||
    extractMeta(html, 'og:description') ||
    fallback ||
    '';

  return desc.replace(/\s+/g, ' ').trim();
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
      'accept-language': 'fr-FR,fr;q=0.9'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.text();
}

async function enrichProduct(product, index, total) {
  if (!product || !product.source_url) return product;

  try {
    const html = await fetchHtml(product.source_url);
    const pageText = normalizeText(html);
    const title = extractMeta(html, 'og:title') || '';

    const brand = product.brand || inferBrand(product.name, `${title} ${pageText}`);
    const condition = product.condition || extractCondition(pageText);
    const warranty = product.warranty || extractWarranty(pageText);
    const description = extractDescription(html, product.description || product.name);

    const updated = {
      ...product,
      brand: brand || product.brand || '',
      condition: condition || product.condition || '',
      warranty: warranty || product.warranty || '',
      description: description || product.description || product.name,
      description_full: product.description_full || description || product.description || product.name
    };

    console.log(`[${index}/${total}] OK  ${product.name}`);
    if (updated.condition) console.log(`   État      : ${updated.condition}`);
    if (updated.warranty) console.log(`   Garantie  : ${updated.warranty}`);
    if (updated.brand) console.log(`   Marque    : ${updated.brand}`);

    await sleep(350);
    return updated;
  } catch (err) {
    console.log(`[${index}/${total}] ERR ${product.name} -> ${err.message}`);
    return product;
  }
}

async function main() {
  for (const file of FILES) {
    if (!fs.existsSync(file)) continue;

    console.log(`\n===== ${path.basename(file)} =====`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const out = [];

    for (let i = 0; i < data.length; i++) {
      out.push(await enrichProduct(data[i], i + 1, data.length));
    }

    fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
    console.log(`? Enrichi : ${file}`);
  }

  console.log('\n? Enrichissement Pixmania terminé.');
}

main().catch(err => {
  console.error('? Erreur enrichissement Pixmania :', err);
  process.exit(1);
});
