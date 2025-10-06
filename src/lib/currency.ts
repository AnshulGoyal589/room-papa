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

/**
 * Converts an amount from one currency to another using MOCK data.
 * Useful for UI development and testing without making API calls.
 *
 * @param amount The amount of money to convert.
 * @param fromCurrency The currency code to convert from (e.g., 'USD').
 * @param toCurrency The currency code to convert to (e.g., 'INR').
 * @returns The converted amount.
 * @throws An error if a currency code is not found in the mock rates.
 */

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

  // The formula for cross-currency conversion using a base currency (EUR):
  // 1. Convert the initial amount to the base currency (EUR).
  // 2. Convert the amount in the base currency to the target currency.
  const amountInBase = amount / fromRate;
  const convertedAmount = amountInBase * toRate;

  return { price: convertedAmount, currency: toCurrency };
}



// // --- OPTION 2: Production-Ready API Conversion Function ---

// let cachedRates: {
//   rates: Rates;
//   timestamp: number;
// } | null = null;

// const CACHE_DURATION_MS = 60 * 60 * 1000; // Cache rates for 1 hour

// /**
//  * Fetches the latest exchange rates from a free API (api.frankfurter.app).
//  * It uses an in-memory cache to avoid excessive API calls.
//  * @returns A promise that resolves to an object of exchange rates.
//  */
// async function getExchangeRates(): Promise<Rates> {
//   // Check if we have valid, non-expired cached rates
//   if (cachedRates && (Date.now() - cachedRates.timestamp < CACHE_DURATION_MS)) {
//     return cachedRates.rates;
//   }

//   try {
//     // Using api.frankfurter.app because it's free, no API key required, and uses ECB data.
//     const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
//     if (!response.ok) {
//       throw new Error('Failed to fetch exchange rates.');
//     }
//     const data = await response.json();
    
//     // Add the base currency to the rates object
//     const ratesWithBase = { ...data.rates, EUR: 1 };

//     // Update cache
//     cachedRates = {
//       rates: ratesWithBase,
//       timestamp: Date.now(),
//     };

//     return ratesWithBase;

//   } catch (error) {
//     console.error("Currency API Error:", error);
//     // If API fails, you might want to fall back to stale cache or mock data
//     if (cachedRates) return cachedRates.rates;
//     throw new Error('Could not fetch exchange rates and no cache is available.');
//   }
// }

// /**
//  * Converts an amount from one currency to another using LIVE data from an API.
//  *
//  * @param amount The amount of money to convert.
//  * @param fromCurrency The currency code to convert from (e.g., 'USD').
//  * @param toCurrency The currency code to convert to (e.g., 'INR').
//  * @returns A Promise that resolves to the converted amount.
//  * @throws An error if the API call fails or currency codes are invalid.
//  */
// export async function convertCurrency(
//   amount: number,
//   fromCurrency: string,
//   toCurrency: string
// ): Promise<number> {
//   if (fromCurrency === toCurrency) {
//     return amount;
//   }

//   const rates = await getExchangeRates();

//   const fromRate = rates[fromCurrency];
//   const toRate = rates[toCurrency];

//   if (!fromRate || !toRate) {
//     throw new Error(`Invalid currency code. Could not find rates for ${fromCurrency} or ${toCurrency}.`);
//   }

//   // Same conversion logic as the mock function, but with live rates.
//   const amountInBase = amount / fromRate;
//   const convertedAmount = amountInBase * toRate;

//   return convertedAmount;
// }