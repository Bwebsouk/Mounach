const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  try {
    // Lance Puppeteer avec Chromium en mode headless
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Navigue vers l'URL du produit
    const url = "https://www.pixmania.com/fr/fr/iphone-16-pro-max-5g-titane-sable-256-go-debloque-309515.html?oid=14809408";
    await page.goto(url, { waitUntil: "networkidle2" });
    
    // Attendre que le sélecteur contenant le titre du produit apparaisse
    await page.waitForSelector(".item-productTitle", { timeout: 10000 });
    
    // Extraire le contenu
    const productData = await page.evaluate(() => {
      // Récupérer le titre du produit
      const titleElement = document.querySelector(".item-productTitle");
      const title = titleElement ? titleElement.innerText.trim() : "Titre non trouvé";
      
      // Récupérer le prix (adaptez le sélecteur selon l'inspection réelle)
      const priceElement = document.querySelector(".item-productPrice");
      const price = priceElement ? priceElement.innerText.trim() : "Prix non trouvé";
      
      // Récupérer la disponibilité si présent
      const availElement = document.querySelector(".item-productAvailability");
      const availability = availElement ? availElement.innerText.trim() : "Disponibilité non spécifiée";
      
      return { title, price, availability };
    });
    
    console.log("Produit scrappé avec Puppeteer :", productData);
    
    // Sauvegarde les données dans public/products.json
    const output = [ { url, ...productData } ];
    fs.writeFileSync("public/products.json", JSON.stringify(output, null, 2), "utf-8");
    
    await browser.close();
    console.log("Scraping terminé. Données enregistrees dans public/products.json");
    
  } catch (error) {
    console.error("Erreur lors du scraping avec Puppeteer :", error);
  }
})();