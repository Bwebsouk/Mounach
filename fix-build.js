const fs = require("fs");
const p = require("./package.json");
p.scripts.build = "webpack --mode production && node scripts/copy-public.js";
fs.writeFileSync("package.json", JSON.stringify(p, null, 2));
console.log("BUILD =", p.scripts.build);
