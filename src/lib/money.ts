const SYMBOLS: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  PHP: '₱',
  GBP: '£',
  KRW: '₩',
  SGD: 'S$',
  AUD: 'A$',
  VND: '₫',
};

/** Currencies offered by the composer picker (any ISO-3 code is valid in the DB). */
export const COMMON_CURRENCIES = ['THB', 'USD', 'PHP', 'EUR', 'JPY', 'GBP', 'KRW', 'SGD'];

export function formatMoney(amount: number, currency: string): string {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const symbol = SYMBOLS[currency];
  return symbol ? `${symbol}${formatted}` : `${currency} ${formatted}`;
}
