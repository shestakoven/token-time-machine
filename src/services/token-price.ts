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
    "https://api.dex.guru/v3/tokens/search/" + tokenName,
  );
  const respJson = await resp.json();
  const data = respJson.data
  const firstToken = data[0];
  
  return {
    currentPrice: firstToken.priceUSD,
  };
}
