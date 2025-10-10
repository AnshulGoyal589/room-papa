import { CurrencyCosting } from "./mongodb/models/Components";

// Let's define a type for our rates object for better type safety.
export type Rates = {
  [key: string]: number;
};

const mockRates: Rates = {
  EUR: 1,      // Base Currency
  INR: 91.50,  // Indian Rupee
  USD: 1.08,   // United States Dollar
  GBP: 0.86,   // Pound Sterling
  JPY: 170.25, // Japanese Yen
  AUD: 1.64,   // Australian Dollar
  CAD: 1.48,   // Canadian Dollar
  CHF: 0.98,   // Swiss Franc
  CNY: 7.85,   // Chinese Yuan
  SEK: 11.30,  // Swedish Krona
  NZD: 1.78,   // New Zealand Dollar
  MXN: 18.55,  // Mexican Peso
  SGD: 1.46,   // Singapore Dollar
  HKD: 8.45,   // Hong Kong Dollar
  NOK: 11.52,  // Norwegian Krone
  KRW: 1490.00,// South Korean Won
  TRY: 34.60,  // Turkish Lira
  RUB: 99.10,  // Russian Ruble
  BRL: 5.51,   // Brazilian Real
  ZAR: 20.50,  // South African Rand
  AED: 3.97,   // United Arab Emirates Dirham
  THB: 39.65,  // Thai Baht
  ARS: 975.00, // Argentine Peso (highly volatile)
  CLP: 1055.00,// Chilean Peso
  COP: 4250.00,// Colombian Peso
  EGP: 51.20,  // Egyptian Pound
};

export function convertCurrencyMock(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): CurrencyCosting {

  if (fromCurrency === toCurrency) {
    return { price: amount, currency: toCurrency };
  }

  const fromRate = mockRates[fromCurrency];
  const toRate = mockRates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error('Invalid currency code provided for mock conversion.');
  }

  const amountInBase = amount / fromRate;
  const convertedAmount = amountInBase * toRate;

  return { price: convertedAmount, currency: toCurrency };
}



export const currencyToCountryMap: { [key: string]: string } = {
  EUR: 'Eurozone',
  INR: 'India',
  USD: 'United States',
  GBP: 'United Kingdom',
  JPY: 'Japan',
  AUD: 'Australia',
  CAD: 'Canada',
  CHF: 'Switzerland',
  CNY: 'China',
  SEK: 'Sweden',
  NZD: 'New Zealand',
  MXN: 'Mexico',
  SGD: 'Singapore',
  HKD: 'Hong Kong',
  NOK: 'Norway',
  KRW: 'South Korea',
  TRY: 'Turkey',
  RUB: 'Russia',
  BRL: 'Brazil',
  ZAR: 'South Africa',
  AED: 'United Arab Emirates',
  THB: 'Thailand',
  ARS: 'Argentina',
  CLP: 'Chile',
  COP: 'Colombia',
  EGP: 'Egypt',
};

export function getCountryFromCurrency(currencyCode: string | null): string {
  if( currencyCode==null ) return '';
  const country = currencyToCountryMap[currencyCode];
  return country;
}
