
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { DrawResult, NumberStats } from '@/lib/types';
import NumberBall from './NumberBall';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface StatisticsTabProps {
  data: DrawResult[];
  loading: boolean;
  drawName?: string;
}

const calculateNumberStats = (data: DrawResult[]): NumberStats[] => {
  const stats: { [key: number]: { winningCount: number; machineCount: number } } = {};
  for (let i = 1; i <= 90; i++) {
    stats[i] = { winningCount: 0, machineCount: 0 };
  }

  data.forEach(result => {
    result.gagnants.forEach(num => {
      if (stats[num]) stats[num].winningCount++;
    });
    result.machine.forEach(num => {
      if (stats[num]) stats[num].machineCount++;
    });
  });

  return Object.entries(stats).map(([numStr, counts]) => {
    const number = parseInt(numStr);
    return {
      number,
      winningCount: counts.winningCount,
      machineCount: counts.machineCount,
      totalCount: counts.winningCount + counts.machineCount,
    };
  });
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes les données' },
  { value: '50', label: 'Les 50 derniers tirages' },
  { value: '100', label: 'Les 100 derniers tirages' },
  { value: '200', label: 'Les 200 derniers tirages' },
];

export default function StatisticsTab({ data, loading, drawName }: StatisticsTabProps) {
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (filterPeriod === 'all' || data.length === 0) {
      return data;
    }
    const count = parseInt(filterPeriod);
    return data.slice(0, count);
  }, [data, filterPeriod]);

  const numberStats = useMemo(() => {
    if (filteredData.length > 0) {
      return calculateNumberStats(filteredData);
    }
    return [];
  }, [filteredData]);

  const sortedByTotalFrequency = useMemo(() =>
    [...numberStats].sort((a, b) => b.totalCount - a.totalCount),
  [numberStats]);

  const mostFrequent = useMemo(() => sortedByTotalFrequency.slice(0, 5), [sortedByTotalFrequency]);
  const leastFrequent = useMemo(() => sortedByTotalFrequency.slice(-5).reverse(), [sortedByTotalFrequency]);

  const chartData = useMemo(() =>
    numberStats.map(stat => ({ name: stat.number.toString(), Gagnants: stat.winningCount, Machine: stat.machineCount, Total: stat.totalCount }))
    .sort((a,b) => parseInt(a.name) - parseInt(b.name)), // Sort by number for chart X-axis
  [numberStats]);

  const currentFilterLabel = FILTER_OPTIONS.find(opt => opt.value === filterPeriod)?.label || 'Toutes les données';

  if (loading && data.length === 0) { // Show main loading only if initial data isn't there yet
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Calcul des statistiques...</p>
      </div>
    );
  }
  
  if (data.length === 0 && !loading) { // If not loading and still no data (e.g. API error or empty results)
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow">
        <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="text-xl text-muted-foreground mt-4">Données insuffisantes pour les statistiques.</p>
        <p className="text-sm text-muted-foreground mt-2">Veuillez charger ou actualiser les données de tirage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Statistiques de Fréquence {drawName ? ` - ${drawName}` : ''}</CardTitle>
              <CardDescription>
                Analyse de la fréquence d'apparition des numéros. Actuellement affiché : {currentFilterLabel}.
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto min-w-[200px]">
              <Label htmlFor="stats-filter" className="mb-1 text-sm font-medium text-muted-foreground">Filtrer les données</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger id="stats-filter" className="w-full">
                  <Filter className="h-4 w-4 mr-2 opacity-50" />
                  <SelectValue placeholder="Sélectionner période" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex justify-center items-center p-4"><LoadingSpinner /><span className="ml-2">Mise à jour...</span></div>}
          {!loading && filteredData.length === 0 && data.length > 0 && (
             <div className="text-center py-10 bg-muted/50 rounded-lg">
                <Zap className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mt-3">Pas assez de données pour la période sélectionnée.</p>
                <p className="text-sm text-muted-foreground mt-1">Essayez un filtre moins restrictif ou "Toutes les données".</p>
            </div>
          )}
          {!loading && filteredData.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FrequencyList title="Les Plus Fréquents" icon={<TrendingUp className="text-green-500" />} numbers={mostFrequent} />
                <FrequencyList title="Les Moins Fréquents" icon={<TrendingDown className="text-red-500" />} numbers={leastFrequent} />
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-8">Fréquence de tous les numéros ({currentFilterLabel})</h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-60} textAnchor="end" interval={0} fontSize={10} height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="Gagnants" fill="hsl(var(--chart-1))" name="Tirages Gagnants" />
                    <Bar dataKey="Machine" fill="hsl(var(--chart-2))" name="Tirages Machine" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && filteredData.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Tableau Détaillé des Fréquences ({currentFilterLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Numéro</TableHead>
                    <TableHead>Freq. Gagnants</TableHead>
                    <TableHead>Freq. Machine</TableHead>
                    <TableHead>Freq. Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedByTotalFrequency.map((stat) => (
                    <TableRow key={stat.number}>
                      <TableCell className="font-medium">
                        <NumberBall number={stat.number} size="sm" />
                      </TableCell>
                      <TableCell>{stat.winningCount}</TableCell>
                      <TableCell>{stat.machineCount}</TableCell>
                      <TableCell>{stat.totalCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FrequencyListProps {
  title: string;
  icon: React.ReactNode;
  numbers: NumberStats[];
}

const FrequencyList: React.FC<FrequencyListProps> = ({ title, icon, numbers }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {numbers.length > 0 ? (
        <ul className="space-y-2">
          {numbers.map(stat => (
            <li key={stat.number} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
              <NumberBall number={stat.number} size="sm" />
              <span className="text-sm text-muted-foreground">
                Total: {stat.totalCount} (G: {stat.winningCount}, M: {stat.machineCount})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune donnée à afficher pour cette sélection.</p>
      )}
    </CardContent>
  </Card>
);


    