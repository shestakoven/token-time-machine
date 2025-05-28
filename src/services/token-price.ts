
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
  /**
   * The symbol of the token (e.g., BTC, ETH).
   */
  symbol: string;
}

/**
 * Asynchronously retrieves the current price, ID, and symbol of a token from DexGuru.
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

  if (typeof firstToken.priceUSD !== 'number' || !firstToken.id || typeof firstToken.symbol !== 'string') {
    throw new Error(`Invalid data structure for token ${tokenName} from DexGuru search API.`)
  }

  return {
    currentPrice: firstToken.priceUSD,
    id: firstToken.id, // e.g., "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-ethereum"
    symbol: firstToken.symbol,
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
 * @param tokenName The name or symbol of the token (for error messages).
 * @param date The date for which to fetch the price (YYYY-MM-DD).
 * @returns A promise that resolves to a HistoricalTokenPriceInfo object.
 */
export async function getHistoricalTokenPrice(
  tokenId: string,
  tokenName: string,
  date: string
): Promise<HistoricalTokenPriceInfo> {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to start of today for comparison
  const requestedDate = new Date(date + "T00:00:00.000Z"); // Ensure UTC interpretation

  if (requestedDate > currentDate) {
    throw new Error(`Cannot fetch historical price for a future date (${date}) for ${tokenName}. Please select a past or current date.`);
  }


  const symbol = `${tokenId}_USD`; // Construct symbol like "0xaddress-chain_USD"

  // Calculate 'from' and 'to' timestamps for the given date (UTC)
  const purchaseDateStart = new Date(`${date}T00:00:00.000Z`);
  const purchaseDateEnd = new Date(`${date}T23:59:59.999Z`);

  const fromTimestamp = Math.floor(purchaseDateStart.getTime() / 1000);
  const toTimestamp = Math.floor(purchaseDateEnd.getTime() / 1000);

  // Using "1D" for daily resolution to get a single price point for the day.
  const resolution = 'D'; // "D" is typically for daily
  const historyUrl = `https://api.dex.guru/v1/tradingview/history?symbol=${symbol}&resolution=${resolution}&from=${fromTimestamp}&to=${toTimestamp}&countback=1`;
  
  console.log(`Fetching historical price from: ${historyUrl}`);

  const resp = await fetch(historyUrl, {cache: 'no-store'});
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch historical price for ${tokenName} (${tokenId}) on ${date}: ${resp.status} ${resp.statusText}. URL: ${historyUrl}`
    );
  }

  const historyData = await resp.json();
  let priceToUse: number | undefined = undefined;

  // Check response structure and data availability
  if (historyData.s === 'ok' && historyData.c && historyData.c.length > 0) {
    priceToUse = historyData.c[0]; // Closing price for the day
    console.log(`Using historical price from ${date}: ${priceToUse} for ${tokenName}`);
  } else if (historyData.s === 'no_data' || (historyData.c && historyData.c.length === 0)) {
    // Try to get the price from the day before if current day has no data
    const prevDate = new Date(purchaseDateStart);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateString = prevDate.toISOString().split('T')[0];

    if (prevDate > currentDate) { // Don't try to fetch future "previous" dates
      throw new Error(`No historical data found for ${tokenName} on ${date}. Attempted to check ${prevDateString}, which is in the future.`);
    }


    const prevFromTimestamp = Math.floor(prevDate.getTime() / 1000);
    // For 'to', we want the end of that previous day to ensure we capture any trade.
    const prevPurchaseDateEnd = new Date(prevDateString + "T23:59:59.999Z");
    const prevToTimestamp = Math.floor(prevPurchaseDateEnd.getTime() / 1000);

    const prevHistoryUrl = `https://api.dex.guru/v1/tradingview/history?symbol=${symbol}&resolution=${resolution}&from=${prevFromTimestamp}&to=${prevToTimestamp}&countback=1`;
    console.log(`No data for ${date}, trying ${prevDateString}: ${prevHistoryUrl}`);
    
    const prevResp = await fetch(prevHistoryUrl, {cache: 'no-store'});
    if(!prevResp.ok) {
       throw new Error(`API error when fetching previous day's price for ${tokenName} on ${prevDateString}: ${prevResp.status} ${prevResp.statusText}`);
    }
    const prevHistoryData = await prevResp.json();
     if (prevHistoryData.s !== 'ok' || !prevHistoryData.c || prevHistoryData.c.length === 0) {
        throw new Error(`No historical data found for ${tokenName} on ${date} or the day before (${prevDateString}). API status: ${prevHistoryData.s}`);
     }
     priceToUse = prevHistoryData.c[0];
     console.log(`Using historical price from ${prevDateString}: ${priceToUse} for ${tokenName}`);
  } else if (historyData.s !== 'ok') {
     throw new Error(
      `DexGuru API error for historical price of ${tokenName} on ${date}: ${historyData.errmsg || 'Unknown API error'}. URL: ${historyUrl}`
    );
  }

  if (priceToUse === undefined) {
    throw new Error(`Could not determine a historical price for ${tokenName} on ${date} or the day before.`);
  }

  if (typeof priceToUse !== 'number') {
     throw new Error(`Fetched historical price for ${tokenName} on ${date} is not a number (got ${priceToUse}).`);
  }
  if (priceToUse < 0) {
      throw new Error(`Fetched historical price for ${tokenName} on ${date} is negative (${priceToUse}). This is invalid.`);
  }
  if (priceToUse === 0) {
    // This is a critical case as it would lead to division by zero when calculating quantity.
    // The user should be informed clearly.
    throw new Error(
      `No valid trading price (price was $0.00) found for ${tokenName} on ${date} or the day prior. ` +
      `This may indicate no trading activity or data availability for this period. Please try a different date or token.`
    );
  }


  return {priceUSD: priceToUse};
}

