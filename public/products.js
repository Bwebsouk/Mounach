document.addEventListener("DOMContentLoaded", () => {
  fetch("products.json")
    .then((res) => res.json())
    .then((produits) => {
      const container = document.getElementById("products-container");
      if (!container) return console.error("Container introuvable");

      produits.forEach((produit) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = 
          <img src="${produit.image}" alt="${produit.nom}" class="product-image" />
          <h2 class="product-title">${produit.nom}</h2>
          <p class="product-price">${produit.prix}</p>
          <p class="product-dispo">${produit.dispo}</p>
          <a href="${produit.url}" target="_blank">Voir le produit</a>
        ;
        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Erreur de chargement :", err);
    });
});