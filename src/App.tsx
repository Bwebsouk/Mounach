import React, { useEffect, useState } from "react";

interface Product {
  url: string;
  name: string;
  price: string;
  availability: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/products.json")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement de /products.json :", err);
      });
  }, []);

  return (
    <div>
      <h1>Nos produits disponibles</h1>
      {products.length === 0 ? (
        <p>Aucun produit à afficher.</p>
      ) : (
        <ul>
          {products.map((p, idx) => (
            <li key={idx}>
              <h2>{p.name}</h2>
              <p>Prix : {p.price}</p>
              <p>Disponibilité : {p.availability}</p>
              <a href={p.url} target="_blank" rel="noreferrer">
                Voir le produit
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;