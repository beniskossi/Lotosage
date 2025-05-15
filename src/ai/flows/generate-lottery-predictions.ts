'use server';
/**
 * @fileOverview Generates lottery predictions for a given draw category using AI.
 *
 * - generateLotteryPredictions - A function that generates lottery predictions.
 * - GenerateLotteryPredictionsInput - The input type for the generateLotteryPredictions function.
 * - GenerateLotteryPredictionsOutput - The output type for the generateLotteryPredictions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLotteryPredictionsInputSchema = z.object({
  drawName: z.string().describe('The name of the lottery draw.'),
  historicalData: z.string().describe('Historical lottery data for the specified draw.'),
});
export type GenerateLotteryPredictionsInput = z.infer<typeof GenerateLotteryPredictionsInputSchema>;

const GenerateLotteryPredictionsOutputSchema = z.object({
  predictions: z.array(z.number()).describe('An array of predicted lottery numbers.'),
  analysis: z.string().describe('An explanation of the factors influencing the predictions.'),
});
export type GenerateLotteryPredictionsOutput = z.infer<typeof GenerateLotteryPredictionsOutputSchema>;

export async function generateLotteryPredictions(input: GenerateLotteryPredictionsInput): Promise<GenerateLotteryPredictionsOutput> {
  return generateLotteryPredictionsFlow(input);
}

const generateLotteryPredictionsPrompt = ai.definePrompt({
  name: 'generateLotteryPredictionsPrompt',
  input: {schema: GenerateLotteryPredictionsInputSchema},
  output: {schema: GenerateLotteryPredictionsOutputSchema},
  prompt: `You are an expert lottery analyst. Analyze the historical lottery data and provide intelligent predictions for the next draw.

Draw Name: {{{drawName}}}
Historical Data: {{{historicalData}}}

Consider factors such as number frequency, trends, and patterns in the historical data. Provide an analysis of the factors influencing the predictions.

Predictions:`, // The output schema description will guide LLM here
});

const generateLotteryPredictionsFlow = ai.defineFlow(
  {
    name: 'generateLotteryPredictionsFlow',
    inputSchema: GenerateLotteryPredictionsInputSchema,
    outputSchema: GenerateLotteryPredictionsOutputSchema,
  },
  async input => {
    const {output} = await generateLotteryPredictionsPrompt(input);
    return output!;
  }
);
