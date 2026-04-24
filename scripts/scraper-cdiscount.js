const puppeteer = require("puppeteer");
const fs = require("fs");

const URL = "https://www.cdiscount.com/electromenager/aspirateurs-nettoyeurs/aspirateurs-robots/l-1101409.html?nav_menu=292:22853:Aspirateur%20robot";

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function getPrices(txt) {
  return [...txt.matchAll(/(\d{2,4})[,.](\d{2})\s*/g)].map(m => Number(`${m[1]}.${m[2]}`));
}

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise(r => setTimeout(r, 10000));

  const data = await page.evaluate(() => ({
    text: document.body.innerText,
    links: Array.from(document.querySelectorAll("a[href*='/f-1101409-']")).map(a => a.href.split("#")[0]),
    images: Array.from(document.querySelectorAll("img[src*='cdiscount.com/pdt']")).map(img => ({
      src: img.src,
      alt: img.alt
    }))
  }));

  const lines = data.text.split("\n").map(clean).filter(Boolean);
  const products = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    let name = "";

    if (/^(Sponsorisé\?|Bon plan|Plus responsable)$/.test(lines[i])) {
      name = lines[i + 1] || "";
    } else {
      name = lines[i];
    }

    name = clean(name.replace(/^Sponsorisé\?\s*/,"").replace(/^Bon plan\s*/,"").replace(/^Plus responsable\s*/,""));

    if (
      name.length < 45 ||
      !/aspirateur|robot|roborock|dreame|ecovacs|proscenic|ultenic|redroad|zynet|liectroux/i.test(name) ||
      /Les aspirateurs robots|Filtres|produits|Livraison|Ajouter|Prix de comparaison|Mode de nettoyage|Capacité|Collecte|Niveau sonore/i.test(name) ||
      seen.has(name)
    ) continue;

    let blockLines = [];
    for (let j = i; j < Math.min(i + 25, lines.length); j++) {
      blockLines.push(lines[j]);
      if (lines[j] === "Ajouter") break;
    }

    const prices = getPrices(blockLines.join(" "));
    if (!prices.length) continue;

    const supplier = prices[prices.length - 1];
    const img = data.images.find(x => clean(x.alt).includes(name.slice(0, 25))) || data.images[products.length];
    const link = data.links[products.length];

    if (!img || !link) continue;

    seen.add(name);

    products.push({
      id: "cdiscount-aspirateur-robot-" + (products.length + 1),
      name,
      slug: slugify(name),
      description: name,
      description_full: name,
      image: img.src,
      gallery: [],
      category: "Électroménager",
      subcategory: "Entretien de la maison",
      type: "Aspirateurs robots",
      brand: "",
      condition: "Neuf",
      warranty: "",
      price: Math.round(supplier * 1.20 * 100) / 100,
      original_price: supplier,
      available: true,
      stock: null,
      badge: "Cdiscount",
      supplier_price: supplier,
      source: "cdiscount",
      source_url: link,
      scraped_at: new Date().toISOString(),
      margin_applied: 1.20,
      internal_id: ""
    });

    if (products.length >= 20) break;
  }

  fs.writeFileSync("public/products-cdiscount.json", JSON.stringify(products, null, 2), "utf8");

  console.log("TOTAL Cdiscount:", products.length);
  products.slice(0, 5).forEach(p => console.log(p.name, "|", p.price + ""));

  await browser.close();
})();
