"use client";

import type { DrawResult } from '@/lib/types';
import DrawResultCard from './DrawResultCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataTabProps {
  data: DrawResult[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onForceClearAndReload?: () => void; // Optional for now
  drawName?: string;
}

export default function DataTab({ data, loading, error, onRefresh, onForceClearAndReload, drawName }: DataTabProps) {
  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage title={`Erreur de chargement des données ${drawName ? 'pour ' + drawName : ''}`} message={error} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-semibold">Historique des Tirages {drawName ? ` - ${drawName}` : ''}</h2>
        <div className="flex gap-2">
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {onForceClearAndReload && (
            <Button onClick={onForceClearAndReload} disabled={loading} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Nettoyer et Recharger
            </Button>
          )}
        </div>
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-10 bg-card rounded-lg shadow">
          <p className="text-xl text-muted-foreground">Aucun résultat trouvé pour ce tirage.</p>
          <p className="text-sm text-muted-foreground mt-2">Essayez d'actualiser les données ou vérifiez ultérieurement.</p>
        </div>
      )}

      {data.length > 0 && (
        <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {data.map((result) => (
               // Assuming results are uniquely identifiable by combination of drawName and date, or if ID is present
              <DrawResultCard key={`${result.drawName}-${result.date}-${result.id || ''}`} result={result} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
