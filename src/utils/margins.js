'use strict';

export function computeMargin(supplierPrice) {
  const p = Number(supplierPrice) || 0;

  if (p <= 10) return 0.25;

  if (p <= 100) {
    return 0.25 - ((p - 10) * (0.06 / 90));
  }

  if (p <= 1000) {
    return 0.19 - ((p - 100) * (0.12 / 900));
  }

  return 0.07;
}

export function computePrice(supplierPrice, _category) {
  const p = Number(supplierPrice) || 0;
  const margin = computeMargin(p);
  return Math.ceil(p * (1 + margin)) - 0.01;
}

export function computeOriginalPrice(supplierPrice, _category) {
  const p = Number(supplierPrice) || 0;
  const margin = computeMargin(p);

  if (margin < 0.12) return null;

  return Math.ceil(p * (1 + margin) * 1.12) - 0.01;
}

export const MARGIN_BY_CATEGORY = {};
export const MARGIN_BY_PRICE_BRACKET = [];
