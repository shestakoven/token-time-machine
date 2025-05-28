
/**
 * Represents information about a token, including its current price.
 */
export interface TokenInfo {
  /**
   * The current price of the token.
   */
  currentPrice: number;
}

/**
 * Asynchronously retrieves the current price of a token.
 *
 * @param tokenName The name or symbol of the token.
 * @returns A promise that resolves to a TokenInfo object containing the current price.
 */
export async function getTokenInfo(tokenName: string): Promise<TokenInfo> {
  const resp = await fetch(
    "https://api.dex.guru/v3/tokens/search/" + tokenName, {cache: "no-store"} // Added no-store to ensure fresh data
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch token info for ${tokenName}: ${resp.statusText}`);
  }
  const respJson = await resp.json();
  const data = respJson.data;
  if (!data || data.length === 0) {
    throw new Error(`Token ${tokenName} not found or no price data available.`);
  }
  const firstToken = data[0];
  
  return {
    currentPrice: firstToken.priceUSD,
  };
}

/**
 * Represents historical price information for a token.
 */
export interface HistoricalTokenPriceInfo {
  priceUSD: number;
}

/**
 * Asynchronously retrieves the historical price of a token on a specific date.
 * Placeholder: This function needs a real API integration for actual historical prices.
 * @param tokenName The name or symbol of the token.
 * @param date The date for which to fetch the price (YYYY-MM-DD).
 * @returns A promise that resolves to a HistoricalTokenPriceInfo object.
 */
export async function getHistoricalTokenPrice(tokenName: string, date: string): Promise<HistoricalTokenPriceInfo> {
  console.warn(`getHistoricalTokenPrice is a placeholder. Token: ${tokenName}, Date: ${date}. Using mock data.`);
  // This is a mock implementation. A real implementation would query a historical data API.
  // For demonstration, let's return a somewhat realistic, but fixed, historical price.
  // You might use an API like CoinGecko's /coins/{id}/history?date={dd-mm-yyyy} endpoint.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  // Example: if date is very recent, price might be close to current. If older, could be different.
  // This is highly simplified.
  let mockPrice = 1.0;
  if (tokenName.toLowerCase().includes('btc') || tokenName.toLowerCase().includes('bitcoin')) {
    mockPrice = 60000;
  } else if (tokenName.toLowerCase().includes('eth') || tokenName.toLowerCase().includes('ethereum')) {
    mockPrice = 3000;
  } else {
    mockPrice = Math.random() * 10 + 0.5; // Random price for other tokens
  }
  // A very simple way to make price vary slightly by date (e.g., older dates are cheaper)
  const today = new Date();
  const purchaseDate = new Date(date);
  const diffDays = (today.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24);
  if (diffDays > 30) mockPrice *= 0.8;
  if (diffDays > 365) mockPrice *= 0.5;


  if (mockPrice <= 0) {
     throw new Error(`Mock historical price for ${tokenName} on ${date} is zero or negative, which is invalid.`);
  }

  return { priceUSD: mockPrice };
}
