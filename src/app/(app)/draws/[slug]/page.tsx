"use client";

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTab from '@/components/draws/DataTab';
import StatisticsTab from '@/components/draws/StatisticsTab';
import ConsultTab from '@/components/draws/ConsultTab';
import PredictionTab from '@/components/draws/PredictionTab';
import { useLotteryData } from '@/hooks/useLotteryData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { BarChart3, Brain, Search, Database, ListChecks } from 'lucide-react';

export default function DrawCategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : null;

  const { data, loading, error, currentDrawCategory, refreshData, forceClearAndReload } = useLotteryData(slug);

  if (!currentDrawCategory && !loading) {
    return <ErrorMessage title="Catégorie de tirage non trouvée" message={`La catégorie avec l'identifiant "${slug}" n'existe pas.`} />;
  }
  
  if (loading && !currentDrawCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size={64} />
        <p className="mt-4 text-xl text-muted-foreground">Chargement de la catégorie...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 shadow-md">
          <TabsTrigger value="data" className="text-xs sm:text-sm py-2.5">
            <Database className="w-4 h-4 mr-1 sm:mr-2" />
            Données
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2.5">
            <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="consult" className="text-xs sm:text-sm py-2.5">
            <Search className="w-4 h-4 mr-1 sm:mr-2" />
            Consulter
          </TabsTrigger>
          <TabsTrigger value="prediction" className="text-xs sm:text-sm py-2.5">
            <Brain className="w-4 h-4 mr-1 sm:mr-2" />
            Prédiction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <DataTab 
            data={data} 
            loading={loading} 
            error={error} 
            onRefresh={refreshData}
            onForceClearAndReload={forceClearAndReload}
            drawName={currentDrawCategory?.name} 
          />
        </TabsContent>
        <TabsContent value="statistics">
          <StatisticsTab 
            data={data} 
            loading={loading} 
            drawName={currentDrawCategory?.name}
          />
        </TabsContent>
        <TabsContent value="consult">
          <ConsultTab 
            data={data} 
            loading={loading} 
            drawName={currentDrawCategory?.name}
          />
        </TabsContent>
        <TabsContent value="prediction">
          <PredictionTab 
            historicalData={data} 
            dataLoading={loading} 
            drawName={currentDrawCategory?.name}
            apiDrawName={currentDrawCategory?.apiName || ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
