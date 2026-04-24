/**
 * src/utils/products.js
 * Charge products.json, applique les marges, et ne retourne AU CLIENT
 * que les champs publics. Les donn�es fournisseur ne quittent jamais ce module.
 */

import { useState, useEffect, useMemo } from 'react';
import { computePrice, computeOriginalPrice } from './margins';

const PRODUCTS_URL = undefined || '/products.json';

// Champs internes � jamais envoy�s au client
const INTERNAL_FIELDS = [
  'source', 'source_url', 'supplier_price',
  'scraped_at', 'margin_applied', 'internal_id', 'raw_category',
];

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toPublicProduct(raw) {
  const price         = raw.price         ?? computePrice(raw.supplier_price, raw.category);
  const original_price = raw.original_price ?? computeOriginalPrice(raw.supplier_price, raw.category);

  const pub = {
    id:               raw.id,
    name:             raw.name,
    slug:             raw.slug || slugify(raw.name),
    description:      raw.description || '',
    description_full: raw.description_full || '',
    image:            raw.image || '',
    gallery:          raw.gallery || [],
    category:         raw.category || 'Divers',
    subcategory:      raw.subcategory || '',
    brand:            raw.brand || '',
    price,
    original_price,
    available:        raw.available ?? ((raw.stock ?? 1) > 0),
    stock:            raw.stock ?? null,
    badge:            raw.badge || null,
    // Condition et garantie � toujours du m�me bloc offre, jamais m�lang�s
    condition:        raw.condition || '',
    warranty:         raw.warranty  || '',
    price_auto:       !('price' in raw),
  };

  INTERNAL_FIELDS.forEach(f => delete pub[f]);
  return pub;
}

async function fetchProducts() {
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error(`Erreur ${res.status} � produits inaccessibles`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error('Format products.json invalide');
  return raw.map(toPublicProduct);
}

const PAGE_SIZE = 24;

export function useProducts() {
  const [all,         setAll]         = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [category,    setCategory]    = useState('Tous');
  const [subcategory, setSubcategory] = useState('Tous');
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('default');
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProducts()
      .then(data => { if (alive) { setAll(data); setError(null); } })
      .catch(err => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() =>
    ['Tous', ...[...new Set(all.map(p => p.category))].sort()], [all]);

  const subcategories = useMemo(() => {
    if (category === 'Tous') return [];
    const subs = [...new Set(
      all.filter(p => p.category === category && p.subcategory).map(p => p.subcategory)
    )].sort();
    return subs.length ? ['Tous', ...subs] : [];
  }, [all, category]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (category    !== 'Tous') list = list.filter(p => p.category    === category);
    if (subcategory !== 'Tous') list = list.filter(p => p.subcategory === subcategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'new':        list.sort((a, b) => (b.badge === 'Nouveau' ? 1 : 0) - (a.badge === 'Nouveau' ? 1 : 0)); break;
      case 'promo':      list.sort((a, b) => (b.badge === 'Promo' ? 1 : 0) - (a.badge === 'Promo' ? 1 : 0)); break;
    }
    return list;
  }, [all, category, subcategory, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const products   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category, subcategory, search, sortBy]);

  return {
    products, loading, error,
    categories, subcategories,
    category, setCategory,
    subcategory, setSubcategory,
    search, setSearch,
    sortBy, setSortBy,
    page, setPage, totalPages,
    total: filtered.length,
  };
}
