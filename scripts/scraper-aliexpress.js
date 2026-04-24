#!/usr/bin/env node
'use strict';
/**
 * scripts/scraper-aliexpress.js
 * Stratégies par ordre : JSON embarqué → API interceptée → DOM 2024
 * Usage: node scripts/scraper-aliexpress.js [--pages N] [--cats c1 c2]
 */

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, '../data/scraped');
const DBG  = path.join(__dirname, '../data/debug');

const CATS = {
  smartphones:  { q:'smartphone android 5G unlocked',   label:'Smartphones',        min:25,  max:400 },
  audio:        { q:'wireless earbuds ANC TWS bluetooth',label:'Audio',              min:4,   max:150 },
  montres:      { q:'smartwatch fitness GPS heart rate', label:'Montres connectées', min:8,   max:200 },
  accessoires:  { q:'USB-C charger GaN powerbank case',  label:'Accessoires',        min:1,   max:60  },
  tablettes:    { q:'android tablet 10 inch 4G WiFi',    label:'Tablettes',          min:30,  max:400 },
  informatique: { q:'mechanical keyboard wireless RGB',  label:'Informatique',       min:5,   max:250 },
  gadgets:      { q:'mini projector bluetooth tracker',  label:'Gadgets',            min:3,   max:120 },
};

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];
const rUA  = () => UAs[Math.floor(Math.random() * UAs.length)];
const wait = (a, b=a*1.5) => new Promise(r => setTimeout(r, a + Math.random()*(b-a)));
const slug = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

function extractEmbedded(html) {
  const PATS = [
    /window\.runParams\s*=\s*(\{[\s\S]+?\});\s*(?:window\.|<\/script>)/,
    /window\._dida_config_\s*=\s*\{[^}]*"page"\s*:\s*(\{[\s\S]+?\})\s*\}/,
    /"itemList"\s*:\s*\{\s*"content"\s*:\s*(\[[\s\S]+?\])\s*,\s*"paginationInfo"/,
    /data-aer-json='(\{[\s\S]+?\})' data-aer-type="Search"/,
  ];
  for (const pat of PATS) {
    try {
      const m = html.match(pat);
      if (!m) continue;
      const obj = JSON.parse(m[1]);
      const items =
        obj?.data?.root?.fields?.mods?.itemList?.content ||
        obj?.mods?.itemList?.content ||
        obj?.page?.mods?.itemList?.content ||
        (Array.isArray(obj) ? obj : null);
      if (items?.length) return items;
    } catch {}
  }
  return null;
}

function normalizeAE(item, cat) {
  const id = String(item.productId || item.itemId || item.id || '');
  if (!id) return null;
  const name = (item.title?.displayTitle || item.productTitle || item.subject || '').trim();
  if (!name || name.length < 5) return null;

  let price = null;
  const ps = item.prices || item.price || {};
  const fp = ps.salePrice?.formattedPrice || ps.minPrice?.formattedPrice || item.salePrice?.formattedPrice || String(item.price||'');
  price = parseFloat(fp.replace(/[^0-9.]/g, ''));
  if (!price || isNaN(price) || price < cat.min || price > cat.max) return null;

  let img = item.image?.imgUrl || item.imageUrl || item.img || '';
  if (img.startsWith('//')) img = 'https:' + img;
  if (!img.startsWith('http')) return null;

  const orders = parseInt(String(item.tradeDesc||'0').replace(/\D/g,''))||0;
  return {
    id:`ae_${id}`, name, slug:slug(name), description:name, description_full:'',
    image:img, gallery:[], category:cat.label, subcategory:'',
    brand:(item.storeName||'').trim(), available:true,
    stock:Math.max(10,orders), badge:orders>1000?'Bestseller':null,
    supplier_price:Math.round(price*100)/100, source:'aliexpress',
    source_url:`https://www.aliexpress.com/item/${id}.html`,
    scraped_at:new Date().toISOString(), margin_applied:null, internal_id:id,
  };
}

async function tryDOM(page, cat) {
  const SELS = [
    '[class*="search-item-card-wrapper"]',
    '[class*="product-snippet"]',
    '[data-item-id]',
    '[class*="SearchProductCard"]',
    'a[href*="/item/"][class*="card"]',
  ];
  for (const sel of SELS) {
    try { await page.waitForSelector(sel, { timeout: 6000 }); } catch { continue; }
    const items = await page.evaluate((s, mn, mx) => {
      return [...document.querySelectorAll(s)].slice(0,80).map(c => {
        const a = c.tagName==='A'?c:c.querySelector('a[href*="/item/"]');
        const img = c.querySelector('img');
        const ttl = c.querySelector('[class*="title"],[class*="name"],h3,h2');
        const pEl = c.querySelector('[class*="price"],[class*="Price"]');
        const href = a?.href||'';
        const m = href.match(/\/item\/(\d+)/);
        const pv = parseFloat((pEl?.textContent||'').replace(/[^0-9.]/g,''));
        if (!m||!ttl||!pv||pv<mn||pv>mx) return null;
        const src = img?.src||img?.getAttribute('data-src')||img?.getAttribute('data-lazy')||'';
        return { id:m[1], name:ttl.textContent.trim(), image:src, price:pv, href };
      }).filter(Boolean);
    }, sel, cat.min, cat.max);
    if (items.length) return items;
  }
  return [];
}

async function scrapePage(browser, pageNum, cat, catKey) {
  const page = await browser.newPage();
  const captured = [];
  const results = [];

  page.on('response', async res => {
    if (!res.url().includes('aliexpress.com')) return;
    try {
      if (!(res.headers()['content-type']||'').includes('json')) return;
      const j = await res.json().catch(()=>null);
      if (!j) return;
      const arr = j?.data?.root?.fields?.mods?.itemList?.content || j?.result?.resultList;
      if (Array.isArray(arr) && arr.length) captured.push(...arr);
    } catch {}
  });

  try {
    await page.setUserAgent(rUA());
    await page.setViewport({ width:1440, height:900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language':'fr-FR,fr;q=0.9' });
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (['font','media','websocket'].includes(req.resourceType())) return req.abort();
      req.continue();
    });

    const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(cat.q)}&SortType=total_tranpro_desc&page=${pageNum}&minPrice=${cat.min}&maxPrice=${cat.max}`;
    process.stdout.write(`  p${pageNum} `);
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
    await wait(3500, 5500);

    // Fermer popups
    for (const s of ['#_fd-mask-toggle','[data-role="close"]','button[class*="close"]','.pdp-close-btn']) {
      try { const el=await page.$(s); if(el){await el.click();await wait(300,500);} } catch {}
    }

    // Scroll pour lazy-load
    await page.evaluate(async()=>{
      for(let i=1;i<=8;i++){window.scrollTo(0,document.body.scrollHeight*i/8);await new Promise(r=>setTimeout(r,300));}
    });
    await wait(1500,2500);

    // Stratégie 1 : JSON embarqué
    const html = await page.content();
    const emb  = extractEmbedded(html);
    if (emb?.length) {
      process.stdout.write(`JSON:${emb.length} `);
      for (const i of emb) { const p=normalizeAE(i,cat); if(p) results.push(p); }
    }

    // Stratégie 2 : API interceptée
    if (!results.length && captured.length) {
      process.stdout.write(`API:${captured.length} `);
      for (const i of captured) { const p=normalizeAE(i,cat); if(p) results.push(p); }
    }

    // Stratégie 3 : DOM
    if (!results.length) {
      const domItems = await tryDOM(page, cat);
      process.stdout.write(`DOM:${domItems.length} `);
      for (const d of domItems) {
        if (!d.name||!d.image) continue;
        const img = d.image.startsWith('//')?`https:${d.image}`:d.image;
        if (!img.startsWith('http')) continue;
        results.push({
          id:`ae_${d.id}`, name:d.name, slug:slug(d.name), description:d.name, description_full:'',
          image:img, gallery:[], category:cat.label, subcategory:'', brand:'', available:true, stock:50, badge:null,
          supplier_price:Math.round(d.price*100)/100, source:'aliexpress', source_url:d.href,
          scraped_at:new Date().toISOString(), margin_applied:null, internal_id:d.id,
        });
      }
    }

    if (!results.length) {
      process.stdout.write('VIDE ');
      fs.mkdirSync(DBG,{recursive:true});
      await page.screenshot({path:path.join(DBG,`ae-${catKey}-p${pageNum}.png`),fullPage:true});
      fs.writeFileSync(path.join(DBG,`ae-${catKey}-p${pageNum}.html`),html);
    }
    process.stdout.write(`→${results.length}\n`);

  } catch(err) {
    process.stdout.write(`ERR:${err.message.slice(0,50)}\n`);
  } finally {
    await page.close();
  }
  return results;
}

async function main() {
  const args     = process.argv.slice(2);
  const maxP     = parseInt(args[args.indexOf('--pages')+1])||5;
  const catF     = args.includes('--cats')?args.slice(args.indexOf('--cats')+1).filter(a=>!a.startsWith('--')):null;

  let puppeteer;
  try {
    const ex=require('puppeteer-extra');
    ex.use(require('puppeteer-extra-plugin-stealth')());
    puppeteer=ex;
  } catch { console.error('npm install puppeteer-extra puppeteer-extra-plugin-stealth'); process.exit(1); }

  fs.mkdirSync(OUT,{recursive:true});
  const browser = await puppeteer.launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox','--disable-blink-features=AutomationControlled','--lang=fr-FR'],
  });

  const cats = Object.entries(CATS).filter(([k])=>!catF||catF.includes(k));
  let grand = 0;

  for (const [catKey,cat] of cats) {
    console.log(`\n[AE] ${cat.label}`);
    const map = new Map();
    for (let p=1; p<=maxP; p++) {
      const items = await scrapePage(browser,p,cat,catKey);
      for (const i of items) if(!map.has(i.id)) map.set(i.id,i);
      await wait(4000,8000);
    }
    const arr=[...map.values()];
    fs.writeFileSync(path.join(OUT,`ae-${catKey}.json`),JSON.stringify(arr,null,2));
    console.log(`  ✓ ae-${catKey}.json → ${arr.length} produits`);
    grand+=arr.length;
    await wait(6000,10000);
  }

  await browser.close();
  console.log(`\n✅ Total AliExpress : ${grand} → npm run build-products`);
}

main().catch(e=>{console.error(e.message);process.exit(1);});
