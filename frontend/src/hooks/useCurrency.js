import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const CURRENCIES = {
  USD: { symbol: '$',   locale: 'en-US', name: 'US Dollar' },
  PKR: { symbol: '₨',  locale: 'en-PK', name: 'Pakistani Rupee' },
  EUR: { symbol: '€',  locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£',  locale: 'en-GB', name: 'British Pound' },
  AED: { symbol: 'د.إ', locale: 'ar-AE', name: 'UAE Dirham' },
  SAR: { symbol: '﷼',  locale: 'ar-SA', name: 'Saudi Riyal' },
  INR: { symbol: '₹',  locale: 'en-IN', name: 'Indian Rupee' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
};

// Module-level cache so rates are fetched once per session
let cachedRates = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useCurrency() {
  const { user } = useAuth();
  const code = user?.currency || 'USD';
  const currency = CURRENCIES[code] || CURRENCIES.USD;

  const [rates, setRates] = useState(cachedRates || { USD: 1 });
  const [ratesLoading, setRatesLoading] = useState(!cachedRates);

  useEffect(() => {
    if (cachedRates && Date.now() - cacheTime < CACHE_TTL) {
      setRates(cachedRates);
      setRatesLoading(false);
      return;
    }
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        const fresh = { USD: 1, ...data.rates };  // open.er-api includes PKR, AED, SAR
        cachedRates = fresh;
        cacheTime = Date.now();
        setRates(fresh);
      })
      .catch(() => {
        // Fallback: no conversion, show raw amounts
        cachedRates = { USD: 1 };
        cacheTime = Date.now();
        setRates({ USD: 1 });
      })
      .finally(() => setRatesLoading(false));
  }, []);

  const format = (amount) => {
    const num = parseFloat(amount) || 0;
    const rate = rates[code] ?? 1;
    const converted = num * rate;
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
      }).format(converted);
    } catch {
      return `${currency.symbol}${converted.toFixed(2)}`;
    }
  };

  return { format, symbol: currency.symbol, code, currencies: CURRENCIES, rates, ratesLoading };
}
