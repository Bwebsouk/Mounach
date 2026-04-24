const fs = require("fs");
const { execSync } = require("child_process");

const oldJson = execSync("git show HEAD~1:public/products.json", { encoding: "utf8" });
const pixmania = JSON.parse(oldJson);

const cdiscount = JSON.parse(fs.readFileSync("public/products-cdiscount.json", "utf8")).map(p => {
  const supplier = Number(p.supplier_price || p.original_price || 0);
  const price = p.price ? Number(p.price) : Math.round(supplier * 1.20 * 100) / 100;

  return {
    ...p,
    price,
    original_price: supplier,
    warranty: p.warranty || "",
    category: "Électroménager",
    subcategory: "Entretien de la maison",
    type: "Aspirateurs robots"
  };
});

const merged = [
  ...pixmania.filter(p => p.source !== "cdiscount"),
  ...cdiscount
];

fs.writeFileSync("public/products.json", JSON.stringify(merged, null, 2), "utf8");

console.log("Pixmania restaurés:", pixmania.length);
console.log("Cdiscount ajoutés:", cdiscount.length);
console.log("TOTAL:", merged.length);
