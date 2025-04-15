'use server';
/**
 * @fileOverview Calculates potential profit/loss for a given token based on purchase date and price.
 *
 * - calculateProfitLoss - A function that handles the profit/loss calculation process.
 * - CalculateProfitLossInput - The input type for the calculateProfitLoss function.
 * - CalculateProfitLossOutput - The return type for the calculateProfitLoss function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getTokenInfo} from '@/services/token-price';

const CalculateProfitLossInputSchema = z.object({
  tokenName: z.string().describe('The name or symbol of the token.'),
  purchaseDate: z.string().describe('The date when the token was purchased (YYYY-MM-DD).'),
  purchasePrice: z.number().describe('The price at which the token was purchased.'),
  quantity: z.number().describe('The amount of tokens purchased.'),
});
export type CalculateProfitLossInput = z.infer<typeof CalculateProfitLossInputSchema>;

const CalculateProfitLossOutputSchema = z.object({
  currentPrice: z.number().describe('The current price of the token.'),
  profitLoss: z.number().describe('The calculated profit or loss.'),
});
export type CalculateProfitLossOutput = z.infer<typeof CalculateProfitLossOutputSchema>;

export async function calculateProfitLoss(input: CalculateProfitLossInput): Promise<CalculateProfitLossOutput> {
  return calculateProfitLossFlow(input);
}

const calculateProfitLossPrompt = ai.definePrompt({
  name: 'calculateProfitLossPrompt',
  input: {
    schema: z.object({
      tokenName: z.string().describe('The name or symbol of the token.'),
      purchaseDate: z.string().describe('The date when the token was purchased (YYYY-MM-DD).'),
      purchasePrice: z.number().describe('The price at which the token was purchased.'),
      currentPrice: z.number().describe('The current price of the token.'),
      quantity: z.number().describe('The amount of tokens purchased.'),
    }),
  },
  output: {
    schema: z.object({
      profitLoss: z.number().describe('The calculated profit or loss.'),
    }),
  },
  prompt: `You are a financial expert. Calculate the profit or loss based on the following information:\n\nToken Name: {{{tokenName}}}\nPurchase Date: {{{purchaseDate}}}\nPurchase Price: {{{purchasePrice}}}\nCurrent Price: {{{currentPrice}}}\nQuantity: {{{quantity}}}\n\nCalculate the profit/loss by subtracting the purchase price from the current price, then multiplying by the quantity.\nReturn only the profit/loss amount. Do not include any explanations or additional text.`, 
});

const calculateProfitLossFlow = ai.defineFlow<
  typeof CalculateProfitLossInputSchema,
  typeof CalculateProfitLossOutputSchema
>(
  {
    name: 'calculateProfitLossFlow',
    inputSchema: CalculateProfitLossInputSchema,
    outputSchema: CalculateProfitLossOutputSchema,
  },
  async input => {
    const tokenInfo = await getTokenInfo(input.tokenName);
    const currentPrice = tokenInfo.currentPrice;

    const {output} = await calculateProfitLossPrompt({
      ...input,
      currentPrice,
    });

    return {
      ...output,
      currentPrice,
    };
  }
);
