
"use client";

import { useState } from 'react';
import type { DrawResult } from '@/lib/types';
import { generateLotteryPredictions, type GenerateLotteryPredictionsOutput } from '@/ai/flows/generate-lottery-predictions';
import NumberBall from './NumberBall';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PredictionTabProps {
  historicalData: DrawResult[];
  dataLoading: boolean;
  drawName?: string; // The display name of the draw
  apiDrawName: string; // The API name of the draw, used for predictions
}

export default function PredictionTab({ historicalData, dataLoading, drawName, apiDrawName }: PredictionTabProps) {
  const [prediction, setPrediction] = useState<GenerateLotteryPredictionsOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePrediction = async () => {
    if (historicalData.length === 0) {
      setError("Pas de données historiques disponibles pour générer une prédiction.");
      toast({
        variant: "destructive",
        title: "Données insuffisantes",
        description: "Impossible de générer une prédiction sans historique de tirages.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Format historical data as a string for the AI model, most recent first
      const formattedHistoricalData = historicalData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ensure sorted by date desc
        .slice(0, 75) // Limit to most recent 75 results to manage input size & relevance
        .map(d => {
          let entry = `Date: ${d.date}, Gagnants: ${d.gagnants.join(',')}`;
          if (d.machine && d.machine.length > 0) {
            entry += `, Machine: ${d.machine.join(',')}`;
          }
          return entry;
        })
        .join('\n');

      const input = {
        drawName: apiDrawName, // Use the API name for the AI model
        historicalData: formattedHistoricalData,
      };
      
      const result = await generateLotteryPredictions(input);
      setPrediction(result);
      toast({
        title: "Prédiction Générée",
        description: `Nouvelle prédiction disponible pour ${drawName || apiDrawName}.`,
      });
    } catch (e: any) {
      console.error("Erreur lors de la génération de la prédiction:", e);
      const errorMessage = e.message || "Une erreur est survenue lors de la génération de la prédiction.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erreur de Prédiction",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
     return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Chargement des données historiques...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Prédictions Intelligentes {drawName ? ` - ${drawName}` : ''}</CardTitle>
          <CardDescription>Générez des prédictions basées sur l'analyse IA des données historiques, en considérant la fréquence, les écarts et les tendances.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleGeneratePrediction} disabled={loading || historicalData.length === 0} size="lg" className="w-full sm:w-auto">
            {loading ? <LoadingSpinner size={20} className="mr-2" /> : <Brain className="mr-2 h-5 w-5" />}
            Générer une Prédiction
          </Button>
          {historicalData.length === 0 && !dataLoading && (
             <p className="text-sm text-red-500 mt-4">
               Les données historiques sont nécessaires pour générer des prédictions. Veuillez d'abord charger les données.
             </p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size={32} />
          <p className="ml-3 text-muted-foreground">L'IA analyse les données et génère votre prédiction...</p>
        </div>
      )}

      {error && <ErrorMessage title="Erreur de Prédiction" message={error} />}

      {prediction && !loading && (
        <Card className="shadow-xl animate-fadeIn">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="w-7 h-7" />
                Prédiction pour le prochain tirage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Numéros Prédits et leur Chance Estimée:</h3>
              <div className="flex flex-wrap gap-4 justify-center p-4 bg-primary/10 rounded-lg">
                {prediction.predictedNumbers && prediction.predictedNumbers.length > 0 ? (
                  prediction.predictedNumbers.map((item, index) => (
                    <div key={`pred-${index}-${item.number}`} className="flex flex-col items-center p-2 space-y-1 min-w-[70px]">
                      <NumberBall number={item.number} size="lg" />
                      <span className="text-xs sm:text-sm text-center font-medium text-muted-foreground">{item.chance}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">L'IA n'a pas retourné de numéros prédits pour cette fois.</p>
                )}
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-xl font-semibold mb-3">Analyse de l'IA:</h3>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md whitespace-pre-wrap leading-relaxed">
                {prediction.analysis || "Aucune analyse détaillée n'a été fournie."}
              </p>
            </div>
             <CardDescription className="text-xs text-center pt-4">
                Note: Les prédictions sont générées par une IA et sont basées sur des analyses statistiques des données fournies. Elles ne garantissent pas les résultats futurs. Jouez de manière responsable.
            </CardDescription>
          </CardContent>
        </Card>
      )}
       {!prediction && !loading && !error && historicalData.length > 0 && (
         <Card className="shadow-md text-center py-10">
            <CardContent>
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-lg text-muted-foreground">
                    Cliquez sur "Générer une Prédiction" pour que l'IA analyse les données et propose des numéros.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

