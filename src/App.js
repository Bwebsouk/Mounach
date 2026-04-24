import React, { useState } from 'react';
import { useProducts } from './utils/products';
import Checkout from './components/Checkout';
import './style.css';

function useCart() {
  const [items, setItems] = useState([]);

  const add = p => setItems(prev => {
    const ex = prev.find(i => i.id === p.id);
    return ex
      ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      : [...prev, { ...p, qty: 1 }];
  });

  const remove = id => setItems(prev => prev.filter(i => i.id !== id));

  const update = (id, qty) =>
    qty < 1
      ? remove(id)
      : setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, remove, update, clear, total, count };
}

function Header({ search, onSearch, cartCount, onCartClick }) {
  return (
    <header className="hdr">
      <a href="/" className="logo">B<span>web</span>souk</a>

      <input
        className="search"
        type="text"
        placeholder="Rechercher…"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />

      <button className="cart-btn" onClick={onCartClick}>
        🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>
    </header>
  );
}

const HERO_ZONES = [
  { id: 'electronique', label: 'Électronique', icon: '💻', pos: 'top-left', active: true },
  { id: 'electromenager', label: 'Électroménager', icon: '🏠', pos: 'bottom-left', active: false },
  { id: 'mode', label: 'Mode et Beauté', icon: '👗', pos: 'top-right', active: false },
  { id: 'sports', label: 'Sports et Loisirs', icon: '⚽', pos: 'bottom-right', active: false },
];

function Hero({ onUniverseClick }) {
  return (
    <section className="hero hero-visual" aria-label="Navigation par catégorie">
      <div className="hero-img-container">
        <img
          src="/bwebsouk-hero.jpg"
          alt="Bwebsouk — La porte du souk du web"
          className="hero-brand-img"
          draggable={false}
        />

        {HERO_ZONES.map(z => (
          <button
            key={z.id}
            className={`hero-zone hero-zone--${z.pos}${!z.active ? ' hero-zone--soon' : ''}`}
            onClick={() => onUniverseClick(z.id, z.active)}
            aria-label={z.active ? `Voir ${z.label}` : `${z.label} — bientôt disponible`}
            title={z.active ? z.label : 'Bientôt disponible'}
          >
            <span className="hero-zone-icon">{z.icon}</span>
            <span className="hero-zone-label">{z.label}</span>
            {!z.active && <span className="hero-zone-soon">Bientôt</span>}
          </button>
        ))}

        <button
          className="hero-zone-center"
          onClick={() => onUniverseClick('electronique', true)}
          aria-label="Voir le catalogue Électronique"
        >
          Entrer dans le souk →
        </button>
      </div>

      <div className="hero-trust">
        <span>🌍 Expédition mondiale</span><span className="trust-sep">·</span>
        <span>⚡ Prix optimisés auto</span><span className="trust-sep">·</span>
        <span>🔄 Retours 30 jours</span><span className="trust-sep">·</span>
        <span>💬 Support 7j/7</span>
      </div>
    </section>
  );
}

function Card({ product, onAdd }) {
  const [done, setDone] = useState(false);

  const handle = () => {
    if (!product.available) return;
    onAdd(product);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  const price = Number(product.price) || 0;
  const originalPrice = Number(product.original_price) || 0;

  const discount = originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : null;

  return (
    <article className="card">
      <div className="card-img">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={e => {
            e.target.src = '';
            e.target.style.display = 'none';
          }}
        />

        {product.badge && (
          <span className={`card-badge badge-${String(product.badge).toLowerCase()}`}>
            {product.badge}
          </span>
        )}

        {!product.available && <div className="out-overlay">Rupture</div>}
      </div>

      <div className="card-body">
        <span className="cat">{product.subcategory || product.category}</span>
        <h3 className="pname">{product.name}</h3>
        <p className="pdesc">{product.description || product.name}</p>

        {(product.condition || product.warranty) && (
          <div className="pmeta">
            {product.condition && <span className="pmeta-condition">{product.condition}</span>}
            {product.warranty && <span className="pmeta-warranty">🛡 {product.warranty}</span>}
          </div>
        )}

        <div className="pprices">
          <strong>{price.toFixed(2)} €</strong>
          {originalPrice > price && <s className="poriginal">{originalPrice.toFixed(2)} €</s>}
          {discount && <span className="pdiscount">-{discount}%</span>}
        </div>

        <button className="btn-add" onClick={handle} disabled={!product.available}>
          {!product.available ? 'Indisponible' : done ? '✓ Ajouté' : '+ Ajouter'}
        </button>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="pagination">
      <button
        className="pg-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '…'
          ? <span key={`sep${i}`} className="pg-sep">…</span>
          : (
            <button
              key={p}
              className={`pg-btn ${p === page ? 'active' : ''}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
      )}

      <button
        className="pg-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        ›
      </button>
    </div>
  );
}

function CartDrawer({ open, onClose, items, onRemove, onUpdate, total, onCheckout }) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}

      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-hdr">
          <h2>
            Panier {items.length > 0 && (
              <span className="drawer-count">
                {items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <span>🛒</span>
              <p>Votre panier est vide</p>
              <button className="btn-empty-shop" onClick={onClose}>
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map(i => (
              <div key={i.id} className="cart-item">
                <img
                  src={i.image}
                  alt={i.name}
                  onError={e => {
                    e.target.style.display = 'none';
                  }}
                />

                <div className="cart-item-info">
                  <p className="cart-item-name">{i.name}</p>
                  <p className="cart-item-price">{(Number(i.price) || 0).toFixed(2)} €</p>

                  <div className="cart-qty">
                    <button onClick={() => onUpdate(i.id, i.qty - 1)}>−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => onUpdate(i.id, i.qty + 1)}>+</button>
                  </div>
                </div>

                <button className="cart-item-del" onClick={() => onRemove(i.id)}>
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total">
              <span>Sous-total</span>
              <strong>{(Number(total) || 0).toFixed(2)} €</strong>
            </div>

            <p className="drawer-shipping">
              {total >= 30
                ? '🎉 Livraison offerte !'
                : `Livraison offerte dès 30 € (${(30 - (Number(total) || 0)).toFixed(2)} € restants)`}
            </p>

            <button className="btn-checkout" onClick={onCheckout}>
              Commander — {(Number(total) || 0).toFixed(2)} € →
            </button>

            <button className="btn-continue" onClick={onClose}>
              Continuer mes achats
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default function App() {
  const {
    products, loading, error,
    categories, subcategories,
    category, setCategory,
    subcategory, setSubcategory,
    search, setSearch,
    sortBy, setSortBy,
    page, setPage, totalPages, total,
  } = useProducts();

  const cart = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [universe, setUniverse] = useState(null);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleUniverseClick = (id, active) => {
    if (active) {
      setUniverse('electronique');
      setCategory('Tous');
      setSubcategory('Tous');
    } else {
      setUniverse('soon');
    }

    setTimeout(() => scrollTo('catalogue'), 50);
  };

  return (
    <div className="app">
      <Header
        search={search}
        onSearch={v => {
          setSearch(v);
          scrollTo('catalogue');
        }}
        cartCount={cart.count}
        onCartClick={() => setCartOpen(true)}
      />

      <Hero onUniverseClick={handleUniverseClick} />

      <nav className="cats" id="catalogue">
        {categories.map(c => (
          <button
            key={c}
            className={`cat-tab ${c === category ? 'active' : ''}`}
            onClick={() => {
              setCategory(c);
              setSubcategory('Tous');
              setUniverse('electronique');
            }}
          >
            {c}
          </button>
        ))}

        <select className="sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Défaut</option>
          <option value="price-asc">Prix ↑</option>
          <option value="price-desc">Prix ↓</option>
          <option value="name">A→Z</option>
          <option value="new">Nouveautés</option>
          <option value="promo">Promos</option>
        </select>
      </nav>

      {universe === 'soon' && (
        <div className="universe-soon">
          <span className="universe-soon-icon">🚧</span>
          <h2>Catégorie en préparation</h2>
          <p>Cet univers sera bientôt disponible sur Bwebsouk.</p>
          <button
            className="universe-soon-back"
            onClick={() => {
              setUniverse('electronique');
              setCategory('Tous');
            }}
          >
            Voir Électronique →
          </button>
        </div>
      )}

      {universe !== 'soon' && (
        <>
          {subcategories.length > 0 && (
            <nav className="subcats">
              {subcategories.map(s => (
                <button
                  key={s}
                  className={`subcat-tab ${s === subcategory ? 'active' : ''}`}
                  onClick={() => setSubcategory(s)}
                >
                  {s}
                </button>
              ))}
            </nav>
          )}

          {!loading && !error && (
            <div className="results-bar">
              <span>
                {total} produit{total !== 1 ? 's' : ''}
                {category !== 'Tous' ? ` en ${category}` : ''}
                {search ? ` pour "${search}"` : ''}
              </span>

              {(category !== 'Tous' || search) && (
                <button
                  className="reset-filters"
                  onClick={() => {
                    setCategory('Tous');
                    setSearch('');
                    setSubcategory('Tous');
                  }}
                >
                  × Réinitialiser
                </button>
              )}
            </div>
          )}

          <main className="grid">
            {loading && Array.from({ length: 12 }).map((_, i) => <div key={i} className="skel" />)}
            {error && <p className="err">⚠ {error}</p>}
            {!loading && !error && products.length === 0 && <p className="empty">Aucun produit trouvé.</p>}
            {!loading && products.map(p => <Card key={p.id} product={p} onAdd={cart.add} />)}
          </main>

          {!loading && totalPages > 1 && (
            <div className="pagination-wrap">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={p => {
                  setPage(p);
                  scrollTo('catalogue');
                }}
              />
            </div>
          )}
        </>
      )}

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Bwebsouk — <a href="/mentions-legales.html">Mentions légales</a> · <a href="/cgv.html">CGV</a>
        </p>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        onRemove={cart.remove}
        onUpdate={cart.update}
        total={cart.total}
        onCheckout={openCheckout}
      />

      {checkoutOpen && (
        <Checkout
          items={cart.items}
          total={cart.total}
          onClose={() => {
            setCheckoutOpen(false);
            cart.clear();
          }}
        />
      )}
    </div>
  );
}