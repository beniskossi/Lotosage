
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
  historicalData: z.string().describe('Historical lottery data for the specified draw, with recent results first.'),
});
export type GenerateLotteryPredictionsInput = z.infer<typeof GenerateLotteryPredictionsInputSchema>;

const PredictedNumberSchema = z.object({
  number: z.number().describe('A predicted lottery number.'),
  chance: z.string().describe('The estimated chance or likelihood of this number being drawn (e.g., "High", "Medium", "Low", "15%").'),
});

const GenerateLotteryPredictionsOutputSchema = z.object({
  predictedNumbers: z.array(PredictedNumberSchema).describe('An array of predicted lottery numbers, each with an estimated chance of being drawn.'),
  analysis: z.string().describe('A detailed explanation of the factors influencing the predictions, specifically considering frequency, gaps between appearances, and temporal trends.'),
});
export type GenerateLotteryPredictionsOutput = z.infer<typeof GenerateLotteryPredictionsOutputSchema>;

export async function generateLotteryPredictions(input: GenerateLotteryPredictionsInput): Promise<GenerateLotteryPredictionsOutput> {
  return generateLotteryPredictionsFlow(input);
}

const generateLotteryPredictionsPrompt = ai.definePrompt({
  name: 'generateLotteryPredictionsPrompt',
  input: {schema: GenerateLotteryPredictionsInputSchema},
  output: {schema: GenerateLotteryPredictionsOutputSchema},
  prompt: `You are an expert lottery analyst. Analyze the historical lottery data provided for the draw named '{{{drawName}}}' and provide intelligent predictions for the next draw. The historical data is provided with the most recent results listed first.

Historical Data:
{{{historicalData}}}

For your analysis, you MUST consider the following factors for all numbers involved in the game (typically 1 to 90):
1.  **Frequency:** How often has each number appeared in the past results provided? Identify numbers with high and low frequencies.
2.  **Gaps (Ecarts):** What are the typical intervals (number of draws) between the appearances of each number? Are there any numbers that appear to be "overdue" based on their typical gap?
3.  **Temporal Trends:** Are there any numbers that have been appearing frequently in recent draws ("hot" numbers)? Are there numbers that haven't appeared for a long time ("cold" numbers)? Consider if recent trends are more indicative than long-term frequencies.

Based on this detailed analysis, provide:
1.  **Predicted Numbers:** A list of 5 to 7 predicted numbers. For each predicted number, assign an estimated chance or likelihood of it being drawn (e.g., "High", "Medium", "Low", or a qualitative assessment).
2.  **Analysis Text:** A comprehensive analysis (at least 3-4 paragraphs) explaining the factors that influenced your predictions. Specifically reference your findings on frequency, gaps, and temporal trends for the numbers you've selected and potentially for some numbers you've excluded. Explain your reasoning clearly.

Ensure your output strictly adheres to the requested JSON schema.
`,
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

