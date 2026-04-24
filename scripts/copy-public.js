const fs = require("fs");
const path = require("path");

const files = [
  "products.json",
  "bwebsouk-hero.jpg",
  "bwebsouk-her.jpg",
  "cgv.html",
  "contact.html",
  "mentions-legales.html",
  "confidentialite.html",
  "retours.html",
  "produits.html"
];

if (!fs.existsSync("dist")) fs.mkdirSync("dist");

for (const file of files) {
  const src = path.join("public", file);
  const dest = path.join("dist", file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("copié:", file);
  }
}
