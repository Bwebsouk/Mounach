const axios = require('axios');

const shopKey = "ebf3fa70204262f414cd1274e2486447bac7c62dac4d5030006a8e4e85ac58af612369e2c00642bdf1094027c8d19d5d";

async function getProducts() {
  try {
    const response = await axios.post("https://api.eprolo.com/api/v2/product/list", {
      page: 1,
      pageSize: 20
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": shopKey
      }
    });

    console.log(response.data);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error.message);
  }
}

getProducts();