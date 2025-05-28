
/**
 * Represents information about a token, including its current price and ID.
 */
export interface TokenInfo {
  /**
   * The current price of the token.
   */
  currentPrice: number;
  /**
   * The unique identifier of the token, often including chain info (e.g., "0xaddress-chain").
   */
  id: string;
}

/**
 * Asynchronously retrieves the current price and ID of a token from DexGuru.
 *
 * @param tokenName The name or symbol of the token.
 * @returns A promise that resolves to a TokenInfo object.
 */
export async function getTokenInfo(tokenName: string): Promise<TokenInfo> {
  const searchUrl = `https://api.dex.guru/v3/tokens/search/${encodeURIComponent(tokenName)}`;
  const resp = await fetch(searchUrl, {cache: 'no-store'});
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch token info for ${tokenName}: ${resp.status} ${resp.statusText}`
    );
  }
  const respJson = await resp.json();
  const data = respJson.data;
  if (!data || data.length === 0) {
    throw new Error(`Token ${tokenName} not found or no price data available.`);
  }
  const firstToken = data[0];

  if (typeof firstToken.priceUSD !== 'number' || !firstToken.id) {
    throw new Error(`Invalid data structure for token ${tokenName} from DexGuru search API.`)
  }

  return {
    currentPrice: firstToken.priceUSD,
    id: firstToken.id, // e.g., "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-ethereum"
  };
}

/**
 * Represents historical price information for a token.
 */
export interface HistoricalTokenPriceInfo {
  priceUSD: number;
}

/**
 * Asynchronously retrieves the historical price of a token on a specific date using DexGuru API.
 * @param tokenId The unique ID of the token (e.g., "0xaddress-chain").
 * @param date The date for which to fetch the price (YYYY-MM-DD).
 * @returns A promise that resolves to a HistoricalTokenPriceInfo object.
 */
export async function getHistoricalTokenPrice(
  tokenId: string,
  date: string
): Promise<HistoricalTokenPriceInfo> {
  const symbol = `${tokenId}_USD`; // Construct symbol like "0xaddress-chain_USD"

  // Calculate 'from' and 'to' timestamps for the given date (UTC)
  const purchaseDateStart = new Date(`${date}T00:00:00.000Z`);
  const purchaseDateEnd = new Date(`${date}T23:59:59.999Z`);

  const fromTimestamp = Math.floor(purchaseDateStart.getTime() / 1000);
  const toTimestamp = Math.floor(purchaseDateEnd.getTime() / 1000);

  // Using "1D" for daily resolution.
  const resolution = '1D';
  const historyUrl = `https://api.dex.guru/v1/tradingview/history?symbol=${symbol}&resolution=${resolution}&from=${fromTimestamp}&to=${toTimestamp}&countback=1`;
  
  console.log(`Fetching historical price from: ${historyUrl}`);

  const resp = await fetch(historyUrl, {cache: 'no-store'});
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch historical price for ${tokenId} on ${date}: ${resp.status} ${resp.statusText}`
    );
  }

  const historyData = await resp.json();

  // Check response structure and data availability
  if (historyData.s !== 'ok' && historyData.s !== 'no_data') {
    throw new Error(
      `DexGuru API error for historical price of ${tokenId} on ${date}: ${historyData.errmsg || 'Unknown error'}`
    );
  }
  
  if (historyData.s === 'no_data' || !historyData.c || historyData.c.length === 0) {
    // Try to get the price from the day before if current day has no data
    const prevDate = new Date(purchaseDateStart);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevFromTimestamp = Math.floor(prevDate.getTime() / 1000);
    const prevToTimestamp = prevFromTimestamp + 24 * 60 * 60 -1;
    const prevHistoryUrl = `https://api.dex.guru/v1/tradingview/history?symbol=${symbol}&resolution=${resolution}&from=${prevFromTimestamp}&to=${prevToTimestamp}&countback=1`;
    console.log(`No data for ${date}, trying ${prevDate.toISOString().split('T')[0]}: ${prevHistoryUrl}`);
    const prevResp = await fetch(prevHistoryUrl, {cache: 'no-store'});
    if(!prevResp.ok) {
       throw new Error(`No historical data found for ${tokenId} on ${date} or the day before. API status: ${historyData.s}`);
    }
    const prevHistoryData = await prevResp.json();
     if (prevHistoryData.s !== 'ok' || !prevHistoryData.c || prevHistoryData.c.length === 0) {
        throw new Error(`No historical data found for ${tokenId} on ${date} or the day before. API status: ${prevHistoryData.s}`);
     }
     if (prevHistoryData.c[0] <= 0) {
        throw new Error(`Fetched historical price for ${tokenId} on ${prevDate.toISOString().split('T')[0]} is invalid (≤0).`);
     }
     return {priceUSD: prevHistoryData.c[0]}; // Use the closing price
  }

  const price = historyData.c[0]; // Closing price for the day
  if (typeof price !== 'number' || price <= 0) {
     throw new Error(`Fetched historical price for ${tokenId} on ${date} is invalid (not a positive number).`);
  }

  return {priceUSD: price};
}
