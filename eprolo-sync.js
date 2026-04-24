const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Remplace cette clé par la tienne si besoin
const SHOP_KEY = 'ebf3fa70204262f414cd1274e2486447bac7c62dac4d5030006a8e4e85ac58af612369e2c00642bdf1094027c8d19d5d';

// Cette URL est hypothétique – à corriger si Eprolo fournit une URL différente
const EPROLO_API_URL = 'https://api.eprolo.com/products';

async function fetchProductsFromEprolo() {
  try {
    const response = await axios.post(EPROLO_API_URL, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': SHOP_KEY
      }
    });

    const products = response.data;

    // Crée un fichier produits.json dans le dossier public
    const filePath = path.join(__dirname, 'public', 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

    console.log('Produits récupérés et enregistrés dans public/products.json');
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('Erreur détaillée :', error.response.data);
    } else {
      console.log('Erreur brute :', error);
    }
  }
}

fetchProductsFromEprolo();