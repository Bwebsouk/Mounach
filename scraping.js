const fs = require("fs");
const axios = require("axios");
const { JSDOM } = require("jsdom");

// URL du produit sur Pixmania
const productPages = [
  {
    url: "https://www.pixmania.com/fr/fr/iphone-16-pro-max-5g-titane-sable-256-go-debloque-309515.html?oid=14809408",
    nameSelector: ".item-productTitle",
    priceSelector: ".item-productPrice",
    availabilitySelector: ".item-productAvailability"
  }
];

async function scrapeProducts() {
  const results = [];

  for (const page of productPages) {
    try {
      const response = await axios.get(page.url);
      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const name = document.querySelector(page.nameSelector)
        ? document.querySelector(page.nameSelector).textContent.trim()
        : "Nom introuvable";

      const price = document.querySelector(page.priceSelector)
        ? document.querySelector(page.priceSelector).textContent.trim()
        : "Prix indisponible";

      const availability = document.querySelector(page.availabilitySelector)
        ? document.querySelector(page.availabilitySelector).textContent.trim()
        : "Disponibilite inconnue";

      results.push({
        url: page.url,
        name: name,
        price: price,
        availability: availability
      });

      console.log("Produit scrappe : " + name + " | " + price + " | " + availability);
    } catch (error) {
      console.error("Erreur lors du scraping de " + page.url + " : " + error.message);
    }
  }

  fs.writeFileSync("public/products.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("Scraping termine. Donnees enregistrees dans public/products.json");
}

scrapeProducts();