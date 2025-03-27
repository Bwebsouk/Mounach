import React, { useState } from "react";
import ReactDOM from "react-dom";

// Liste de produits exemple
const rawProducts = [
  { id: 1, name: "Smartphone A", costPrice: 200 },
  { id: 2, name: "Tablette B", costPrice: 300 },
  { id: 3, name: "Écouteurs C", costPrice: 50 },
];

// Calcul du prix de vente avec marge de 2,5 %
function getSalePrice(cost) {
  return cost * 1.025;
}

// Composant pour afficher la liste des produits
function ProductList({ addToCart }) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {rawProducts.map((product) => {
        const salePrice = getSalePrice(product.costPrice).toFixed(2);
        return (
          <li
            key={product.id}
            style={{
              margin: "10px 0",
              backgroundColor: "#333",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <strong>{product.name}</strong>
            <div>Prix d’achat : {product.costPrice} €</div>
            <div style={{ color: "yellow" }}>
              Prix de vente (+2,5 %) : {salePrice} €
            </div>
            <button
              onClick={() => addToCart(product)}
              style={{
                marginTop: "5px",
                padding: "5px 10px",
                backgroundColor: "yellow",
                color: "black",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Ajouter au panier
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Composant de Checkout (simulation)
function Checkout({ cart, total, goBack }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    alert("Commande validée pour " + name + ". Total : " + total.toFixed(2) + " €");
    // Ici, on pourrait intégrer Stripe pour un vrai paiement.
  }

  return (
    <div>
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom : </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Adresse : </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: "10px", padding: "10px", backgroundColor: "green", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Valider la commande
        </button>
      </form>
      <button
        onClick={goBack}
        style={{ marginTop: "10px", padding: "10px", backgroundColor: "gray", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Retour à la boutique
      </button>
    </div>
  );
}

// Composant principal de l'application
function App() {
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Fonction pour ajouter un produit au panier
  function addToCart(product) {
    const salePrice = getSalePrice(product.costPrice);
    const cartItem = { id: product.id, name: product.name, salePrice: salePrice };
    setCart([...cart, cartItem]);
  }

  // Calcul du total du panier
  const total = cart.reduce((sum, item) => sum + item.salePrice, 0);

  return (
    <div style={{ backgroundColor: "#222", color: "#fff", minHeight: "100vh", padding: "20px" }}>
      <h1>Ma Boutique Bwebsouk</h1>
      {!showCheckout ? (
        <>
          <ProductList addToCart={addToCart} />
          <div style={{ marginTop: "30px", backgroundColor: "#444", padding: "10px", borderRadius: "5px" }}>
<h2>Panier</h2>
            {cart.length === 0 ? (
              <p>Votre panier est vide.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {cart.map((item, index) => (
                  <li key={index} style={{ margin: "5px 0", backgroundColor: "#555", padding: "5px", borderRadius: "3px" }}>
                    {item.name} - {item.salePrice.toFixed(2)} €
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: "10px" }}><strong>Total : {total.toFixed(2)} €</strong></p>
            {cart.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                style={{ padding: "10px 15px", backgroundColor: "green", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Passer commande
              </button>
            )}
          </div>
        </>
      ) : (
        <Checkout cart={cart} total={total} goBack={() => setShowCheckout(false)} />
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));