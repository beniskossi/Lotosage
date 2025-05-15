"use client";

import { useState, useEffect, useMemo } from 'react';
import type { DrawResult, ConsultData, CoOccurrenceStat } from '@/lib/types';
import NumberBall from './NumberBall';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, BarChartHorizontalBig } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ConsultTabProps {
  data: DrawResult[];
  loading: boolean;
  drawName?: string;
}

const calculateCoOccurrence = (
  targetNumber: number,
  data: DrawResult[]
): Omit<ConsultData, 'targetNumber'> => {
  const coOccurrencesWinning: { [key: number]: number } = {};
  const coOccurrencesMachine: { [key: number]: number } = {};

  data.forEach(result => {
    const hasTargetWinning = result.gagnants.includes(targetNumber);
    const hasTargetMachine = result.machine.includes(targetNumber);

    if (hasTargetWinning) {
      result.gagnants.forEach(num => {
        if (num !== targetNumber) {
          coOccurrencesWinning[num] = (coOccurrencesWinning[num] || 0) + 1;
        }
      });
    }
    if (hasTargetMachine) {
       result.machine.forEach(num => {
        if (num !== targetNumber) {
          coOccurrencesMachine[num] = (coOccurrencesMachine[num] || 0) + 1;
        }
      });
    }
    // If target is in winning, check machine numbers of same draw for co-occurrence
     if (hasTargetWinning) {
        result.machine.forEach(num => {
            // This logic might need refinement based on exact definition of "co-occurrence"
            // For now, if target is winning, we check other winning AND other machine numbers from same draw.
             coOccurrencesMachine[num] = (coOccurrencesMachine[num] || 0) + 1; // simplified: count if target is winning
        });
    }
  });
  
  const formatStats = (stats: { [key: number]: number }): CoOccurrenceStat[] =>
    Object.entries(stats)
      .map(([numStr, count]) => ({ number: parseInt(numStr), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

  return {
    coOccurrencesWinning: formatStats(coOccurrencesWinning),
    coOccurrencesMachine: formatStats(coOccurrencesMachine),
  };
};


export default function ConsultTab({ data, loading, drawName }: ConsultTabProps) {
  const [targetNumberInput, setTargetNumberInput] = useState<string>('');
  const [consultedData, setConsultedData] = useState<ConsultData | null>(null);
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsult = () => {
    setError(null);
    const num = parseInt(targetNumberInput);
    if (isNaN(num) || num < 1 || num > 90) {
      setError("Veuillez entrer un numéro valide entre 1 et 90.");
      setConsultedData(null);
      return;
    }
    if (data.length === 0) {
      setError("Aucune donnée de tirage disponible pour la consultation.");
      setConsultedData(null);
      return;
    }

    setIsConsulting(true);
    // Simulate a short delay for calculation if needed, otherwise direct
    setTimeout(() => {
      const stats = calculateCoOccurrence(num, data);
      setConsultedData({ targetNumber: num, ...stats });
      setIsConsulting(false);
    }, 100); // Small delay to show loading state
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Chargement des données de consultation...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Consulter la Régularité d'un Numéro {drawName ? ` - ${drawName}` : ''}</CardTitle>
          <CardDescription>Entrez un numéro pour voir sa fréquence d'apparition avec d'autres numéros.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
            <div className="flex-grow">
              <Label htmlFor="targetNumber" className="mb-1 block">Numéro à consulter (1-90)</Label>
              <Input
                id="targetNumber"
                type="number"
                value={targetNumberInput}
                onChange={(e) => setTargetNumberInput(e.target.value)}
                placeholder="Ex: 25"
                min="1"
                max="90"
                className="text-lg"
              />
            </div>
            <Button onClick={handleConsult} disabled={isConsulting || data.length === 0} className="w-full sm:w-auto">
              {isConsulting ? <LoadingSpinner size={20} className="mr-2" /> : <Search className="mr-2 h-4 w-4" />}
              Consulter
            </Button>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        </CardContent>
      </Card>

      {isConsulting && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size={32} />
          <p className="ml-3 text-muted-foreground">Analyse en cours...</p>
        </div>
      )}

      {consultedData && !isConsulting && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartHorizontalBig className="w-6 h-6 text-primary" />
              Résultats pour le numéro <NumberBall number={consultedData.targetNumber} size="md" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CoOccurrenceSection title="Co-apparition (Numéros Gagnants)" stats={consultedData.coOccurrencesWinning} />
            <Separator />
            <CoOccurrenceSection title="Co-apparition (Numéros Machine)" stats={consultedData.coOccurrencesMachine} />
          </CardContent>
        </Card>
      )}
       {!consultedData && !isConsulting && !error && data.length > 0 && (
        <Card className="shadow-md text-center py-10">
            <CardContent>
                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-lg text-muted-foreground">
                    Entrez un numéro ci-dessus et cliquez sur "Consulter" pour voir les statistiques de co-occurrence.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CoOccurrenceSectionProps {
  title: string;
  stats: CoOccurrenceStat[];
}

const CoOccurrenceSection: React.FC<CoOccurrenceSectionProps> = ({ title, stats }) => (
  <div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    {stats.length > 0 ? (
      <ul className="space-y-2">
        {stats.map(stat => (
          <li key={stat.number} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/60 transition-colors">
            <NumberBall number={stat.number} size="sm" />
            <span className="text-sm font-medium text-primary">Apparu {stat.count} fois ensemble</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">Aucune co-occurrence significative trouvée pour cette catégorie.</p>
    )}
  </div>
);
