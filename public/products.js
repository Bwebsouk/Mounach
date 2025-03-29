// products.js

document.addEventListener("DOMContentLoaded", () => {
  fetch("products.json")
    .then((res) => res.json())
    .then((products) => {
      const container = document.getElementById("products-container");

      if (!container) {
        console.error("Conteneur introuvable : #products-container");
        return;
      }

      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = 
          <img src="${product.image}" alt="${product.title}" class="product-image" />
          <h2 class="product-title">${product.title}</h2>
          <p class="product-description">${product.description}</p>
          <p class="product-price">${product.price} €</p>
          <button class="add-to-cart-btn">Ajouter au panier</button>
        ;

        container.appendChild(card);
      });
    })
    .catch((err) =>
      console.error("Erreur de chargement des produits :", err)
    );
});