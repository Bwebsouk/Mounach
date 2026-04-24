/**
 * src/components/Checkout.js
 * Modal de commande : formulaire client + rÃ©capitulatif + Stripe-ready.
 *
 * Pour activer Stripe :
 *  1. npm install @stripe/stripe-js @stripe/react-stripe-js
 *  2. Remplacer simulatePayment() par un appel Ã  votre backend /create-payment-intent
 *  3. DÃ©commenter les imports Stripe ci-dessous
 */

import React, { useState } from 'react';

// -- Stripe (dÃ©commenter quand prÃªt) --
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK);

const STEPS = ['Livraison', 'Paiement', 'Confirmation'];

function StepBar({ current }) {
  return (
    <div className="chk-steps">
      {STEPS.map((s, i) => (
        <div key={s} className={`chk-step ${i <= current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
          <span className="chk-step-num">{i < current ? 'âœ“' : i + 1}</span>
          <span className="chk-step-label">{s}</span>
          {i < STEPS.length - 1 && <div className="chk-step-line" />}
        </div>
      ))}
    </div>
  );
}

function ShippingForm({ data, onChange, onNext }) {
  const fields = [
    { name: 'firstName', label: 'PrÃ©nom', type: 'text',  required: true, half: true },
    { name: 'lastName',  label: 'Nom',    type: 'text',  required: true, half: true },
    { name: 'email',     label: 'Email',  type: 'email', required: true },
    { name: 'phone',     label: 'TÃ©lÃ©phone', type: 'tel', required: true },
    { name: 'address',   label: 'Adresse',   type: 'text', required: true },
    { name: 'city',      label: 'Ville',     type: 'text', required: true, half: true },
    { name: 'zip',       label: 'Code postal', type: 'text', required: true, half: true },
    { name: 'country',   label: 'Pays',     type: 'select', required: true },
  ];
  const countries = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 'Maroc', 'Tunisie', 'AlgÃ©rie'];

  const validate = () => {
    return fields.every(f => !f.required || data[f.name]?.trim());
  };

  return (
    <div className="chk-section">
      <h3 className="chk-section-title">Adresse de livraison</h3>
      <div className="chk-fields">
        {fields.map(f => (
          <div key={f.name} className={`chk-field ${f.half ? 'half' : ''}`}>
            <label className="chk-label">{f.label}{f.required && ' *'}</label>
            {f.type === 'select' ? (
              <select className="chk-input" value={data[f.name] || ''} onChange={e => onChange(f.name, e.target.value)}>
                <option value="">Choisir un pays</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input className="chk-input" type={f.type} value={data[f.name] || ''}
                onChange={e => onChange(f.name, e.target.value)}
                placeholder={f.label} />
            )}
          </div>
        ))}
      </div>
      <button className="btn-chk-next" onClick={onNext} disabled={!validate()}>
        Continuer vers le paiement â†’
      </button>
    </div>
  );
}

function PaymentForm({ items, total, shipping, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [method, setMethod] = useState('card'); // 'card' | 'paypal'

  const formatCard = (val) => val.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (val) => val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);

  async function simulatePayment() {
    setLoading(true);
    // â”€â”€ Remplacer par appel Stripe rÃ©el â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // const intent = await fetch('/api/payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount: Math.round(total * 100), currency: 'eur' })
    // }).then(r => r.json());
    // const stripe = await stripePromise;
    // const result = await stripe.confirmCardPayment(intent.clientSecret, { ... });
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await new Promise(r => setTimeout(r, 1800)); // simulation dÃ©lai paiement
    setLoading(false);
    onSuccess({ orderId: `BWS-${Date.now().toString(36).toUpperCase()}`, total, shipping });
  }

  return (
    <div className="chk-section">
      <h3 className="chk-section-title">Paiement sÃ©curisÃ©</h3>

      {/* MÃ©thode de paiement */}
      <div className="chk-methods">
        <button className={`chk-method ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}>
          <span>ðŸ’³</span> Carte bancaire
        </button>
        <button className={`chk-method ${method === 'paypal' ? 'active' : ''}`} onClick={() => setMethod('paypal')}>
          <span>ðŸ…¿</span> PayPal
        </button>
      </div>

      {method === 'card' && (
        <div className="chk-fields">
          <div className="chk-field">
            <label className="chk-label">Titulaire de la carte *</label>
            <input className="chk-input" placeholder="Nom sur la carte"
              value={cardData.name} onChange={e => setCardData(p => ({...p, name: e.target.value}))} />
          </div>
          <div className="chk-field">
            <label className="chk-label">NumÃ©ro de carte *</label>
            <input className="chk-input chk-card-num" placeholder="4242 4242 4242 4242"
              value={cardData.number} maxLength={19}
              onChange={e => setCardData(p => ({...p, number: formatCard(e.target.value)}))} />
          </div>
          <div className="chk-field half">
            <label className="chk-label">Expiration *</label>
            <input className="chk-input" placeholder="MM/AA"
              value={cardData.expiry} maxLength={5}
              onChange={e => setCardData(p => ({...p, expiry: formatExpiry(e.target.value)}))} />
          </div>
          <div className="chk-field half">
            <label className="chk-label">CVV *</label>
            <input className="chk-input" placeholder="123" type="password"
              value={cardData.cvv} maxLength={4}
              onChange={e => setCardData(p => ({...p, cvv: e.target.value.replace(/\D/g, '')}))} />
          </div>
          <div className="chk-secure-notice">
            ðŸ”’ Paiement sÃ©curisÃ© SSL Â· 3D Secure Â· DonnÃ©es chiffrÃ©es
          </div>
        </div>
      )}

      {method === 'paypal' && (
        <div className="chk-paypal-note">
          Vous serez redirigÃ© vers PayPal pour finaliser le paiement en toute sÃ©curitÃ©.
        </div>
      )}

      <div className="chk-actions">
        <button className="btn-chk-back" onClick={onBack}>â† Retour</button>
        <button className="btn-chk-pay" onClick={simulatePayment}
          disabled={loading || (method === 'card' && (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name))}>
          {loading ? 'â³ Traitementâ€¦' : `Payer ${total.toFixed(2)} â‚¬`}
        </button>
      </div>
    </div>
  );
}

function OrderSummary({ items, total }) {
  const shipping = total >= 30 ? 0 : 4.99;
  return (
    <div className="chk-summary">
      <h3 className="chk-section-title">RÃ©capitulatif</h3>
      <ul className="chk-summary-items">
        {items.map(i => (
          <li key={i.id} className="chk-summary-item">
            <img src={i.image} alt={i.name} onError={e => e.target.style.display='none'} />
            <div>
              <p>{i.name}</p>
              <span>Ã— {i.qty} â€” {(i.price * i.qty).toFixed(2)} â‚¬</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="chk-totals">
        <div className="chk-total-row"><span>Sous-total</span><span>{total.toFixed(2)} â‚¬</span></div>
        <div className="chk-total-row"><span>Livraison</span><span>{shipping === 0 ? 'Offerte' : `${shipping.toFixed(2)} â‚¬`}</span></div>
        <div className="chk-total-row final"><span>Total</span><strong>{(total + shipping).toFixed(2)} â‚¬</strong></div>
      </div>
    </div>
  );
}

function Confirmation({ order, onClose }) {
  return (
    <div className="chk-confirm">
      <div className="chk-confirm-icon">âœ…</div>
      <h2>Commande confirmÃ©e !</h2>
      <p className="chk-confirm-id">RÃ©fÃ©rence : <strong>{order.orderId}</strong></p>
      <p>Un email de confirmation vous a Ã©tÃ© envoyÃ©. Votre commande sera traitÃ©e sous 24h.</p>
      <div className="chk-confirm-details">
        <div>Total payÃ© : <strong>{order.total.toFixed(2)} â‚¬</strong></div>
        <div>Livraison estimÃ©e : <strong>3â€“7 jours ouvrÃ©s</strong></div>
      </div>
      <button className="btn-chk-next" onClick={onClose}>Retour Ã  la boutique</button>
    </div>
  );
}

// â”€â”€ Composant principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Checkout({ items, total, onClose }) {
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({});
  const [order, setOrder] = useState(null);

  const finalTotal = total + (total >= 30 ? 0 : 4.99);

  return (
    <div className="chk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="chk-modal" role="dialog" aria-modal="true" aria-label="Finaliser ma commande">

        <div className="chk-modal-header">
          <h2>Finaliser ma commande</h2>
          <button className="chk-close" onClick={onClose} aria-label="Fermer">âœ•</button>
        </div>

        {!order && <StepBar current={step} />}

        <div className="chk-body">
          <div className="chk-main">
            {order ? (
              <Confirmation order={order} onClose={onClose} />
            ) : step === 0 ? (
              <ShippingForm data={shipping}
                onChange={(k, v) => setShipping(p => ({...p, [k]: v}))}
                onNext={() => setStep(1)} />
            ) : (
              <PaymentForm items={items} total={finalTotal} shipping={shipping}
                onBack={() => setStep(0)}
                onSuccess={ord => { setOrder(ord); setStep(2); }} />
            )}
          </div>

          {!order && (
            <aside className="chk-aside">
              <OrderSummary items={items} total={total} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
