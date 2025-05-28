
'use server';
/**
 * @fileOverview Calculates potential profit/loss for a given token based on purchase date and amount invested.
 *
 * - calculateProfitLoss - A function that handles the profit/loss calculation process.
 * - CalculateProfitLossInput - The input type for the calculateProfitLoss function.
 * - CalculateProfitLossOutput - The return type for the calculateProfitLoss function.
 */

import {ai} from '@/ai/ai-instance'; 
import {z} from 'genkit';
import {getTokenInfo, getHistoricalTokenPrice} from '@/services/token-price';

const CalculateProfitLossInputSchema = z.object({
  tokenName: z.string().describe('The name or symbol of the token (user input).'),
  purchaseDate: z.string().describe('The date when the token was purchased (YYYY-MM-DD).'),
  purchaseAmountUSD: z.number().describe('The total amount in USD invested in the token on the purchase date.'),
});
export type CalculateProfitLossInput = z.infer<typeof CalculateProfitLossInputSchema>;

const CalculateProfitLossOutputSchema = z.object({
  apiTokenName: z.string().describe('The official name of the token from the API (e.g., Bitcoin, Ethereum).'),
  apiTokenSymbol: z.string().describe('The symbol of the token from the API (e.g., BTC, ETH).'),
  priceAtPurchase: z.number().describe('The price of the token per unit at the time of purchase.'),
  quantityPurchased: z.number().describe('The amount of tokens purchased.'),
  currentPrice: z.number().describe('The current price of the token per unit.'),
  currentValue: z.number().describe('The current total value of the purchased tokens.'),
  profitLoss: z.number().describe('The calculated profit or loss in USD.'),
});
export type CalculateProfitLossOutput = z.infer<typeof CalculateProfitLossOutputSchema>;

export async function calculateProfitLoss(input: CalculateProfitLossInput): Promise<CalculateProfitLossOutput> {
  return calculateProfitLossFlow(input);
}

const calculateProfitLossFlow = ai.defineFlow(
  {
    name: 'calculateProfitLossFlow',
    inputSchema: CalculateProfitLossInputSchema,
    outputSchema: CalculateProfitLossOutputSchema,
  },
  async (input: CalculateProfitLossInput): Promise<CalculateProfitLossOutput> => {
    const { tokenName: userInputTokenName, purchaseDate, purchaseAmountUSD } = input;

    // 1. Fetch current token info (price, ID, name, and symbol)
    const tokenInfo = await getTokenInfo(userInputTokenName);
    const currentPrice = tokenInfo.currentPrice;
    const tokenId = tokenInfo.id; 
    const apiTokenName = tokenInfo.name;
    const apiTokenSymbol = tokenInfo.symbol;

    // 2. Fetch historical price of the token on the purchaseDate using its ID
    const historicalPriceInfo = await getHistoricalTokenPrice(tokenId, apiTokenName, purchaseDate); // Pass apiTokenName for better error messages
    const priceAtPurchase = historicalPriceInfo.priceUSD;

    // 3. Calculate the quantity of tokens purchased
    const quantityPurchased = purchaseAmountUSD / priceAtPurchase;

    // 4. Calculate the current value of the investment
    const currentValue = quantityPurchased * currentPrice;

    // 5. Calculate profit or loss
    const profitLoss = currentValue - purchaseAmountUSD;

    return {
      apiTokenName,
      apiTokenSymbol,
      priceAtPurchase,
      quantityPurchased,
      currentPrice,
      currentValue,
      profitLoss,
    };
  }
);
