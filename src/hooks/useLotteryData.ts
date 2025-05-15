"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DrawResult } from '@/lib/types';
import { addDrawResults, getDrawResults, clearDrawData, getLatestDrawDate } from '@/lib/indexeddb';
import { useToast } from '@/components/ui/use-toast';
import { getDrawCategoryBySlug, FlatDrawCategory } from '@/lib/config';
import { format, subMonths, getYear, getMonth } from 'date-fns';

const MONTHS_TO_FETCH_INITIALLY = 3; // Fetch last 3 months initially if DB is empty

export function useLotteryData(drawSlug: string | null) {
  const [data, setData] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentDrawCategory, setCurrentDrawCategory] = useState<FlatDrawCategory | null>(null);

  useEffect(() => {
    if (drawSlug) {
      const category = getDrawCategoryBySlug(drawSlug);
      setCurrentDrawCategory(category || null);
    } else {
      setCurrentDrawCategory(null);
    }
  }, [drawSlug]);

  const fetchAndStoreResults = useCallback(async (apiDrawName: string, monthYear?: string) => {
    setLoading(true);
    setError(null);
    try {
      const queryParam = monthYear ? `?month=${monthYear}` : '';
      const response = await fetch(`/api/results${queryParam}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status} lors de la récupération des données.`);
      }
      const fetchedData: DrawResult[] = await response.json();
      
      // Filter for the specific draw category based on apiDrawName
      const relevantData = fetchedData.filter(d => d.drawName === apiDrawName);
      
      if (relevantData.length > 0) {
        await addDrawResults(relevantData);
      }
      return relevantData;
    } catch (e: any) {
      console.error("Erreur lors du fetchAndStoreResults:", e);
      setError(e.message || "Une erreur inconnue est survenue.");
      toast({
        variant: "destructive",
        title: "Erreur de Récupération",
        description: e.message || "Impossible de récupérer les derniers résultats.",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const loadInitialData = useCallback(async (category: FlatDrawCategory) => {
    setLoading(true);
    try {
      let results = await getDrawResults(category.apiName);
      if (results.length === 0) {
        toast({ title: "Base de données locale vide", description: `Chargement initial des données pour ${category.name}...` });
        // Fetch last few months if DB is empty for this category
        const today = new Date();
        for (let i = 0; i < MONTHS_TO_FETCH_INITIALLY; i++) {
          const targetMonth = subMonths(today, i);
          const monthYearStr = format(targetMonth, 'MMMM-yyyy', { locale: {localize:{month:n=>['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][n-1]}} as any}).toLowerCase(); // e.g., mai-2024
          const fetchedForMonth = await fetchAndStoreResults(category.apiName, monthYearStr);
          // results = [...results, ...fetchedForMonth]; // Not strictly needed if getDrawResults is called again
        }
        results = await getDrawResults(category.apiName); // Re-fetch all from DB
      }
      setData(results);
    } catch (e: any) {
      setError(e.message);
      toast({ variant: "destructive", title: "Erreur de chargement", description: e.message });
    } finally {
      setLoading(false);
    }
  }, [fetchAndStoreResults, toast]);


  useEffect(() => {
    if (currentDrawCategory) {
      loadInitialData(currentDrawCategory);
    } else {
      setData([]); // Clear data if no draw category selected
      setLoading(false);
    }
  }, [currentDrawCategory, loadInitialData]);

  const refreshData = useCallback(async () => {
    if (!currentDrawCategory) return;
    setLoading(true);
    toast({ title: "Mise à jour", description: `Recherche de nouveaux résultats pour ${currentDrawCategory.name}...` });
    
    // Fetch for current month and potentially previous month to catch recent results
    const today = new Date();
    const currentMonthStr = format(today, 'MMMM-yyyy', { locale: {localize:{month:n=>['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][n-1]}} as any}).toLowerCase();
    const prevMonthStr = format(subMonths(today, 1), 'MMMM-yyyy', { locale: {localize:{month:n=>['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][n-1]}} as any}).toLowerCase();

    await fetchAndStoreResults(currentDrawCategory.apiName, currentMonthStr);
    await fetchAndStoreResults(currentDrawCategory.apiName, prevMonthStr); // Ensure we catch any late entries from prev month

    const updatedResults = await getDrawResults(currentDrawCategory.apiName);
    setData(updatedResults);
    setLoading(false);
    toast({ title: "Mise à jour terminée", description: `${currentDrawCategory.name} est à jour.` });
  }, [currentDrawCategory, fetchAndStoreResults, toast]);

  const forceClearAndReload = useCallback(async () => {
    if (!currentDrawCategory) return;
    setLoading(true);
    toast({ title: "Nettoyage et Rechargement", description: `Suppression des données locales pour ${currentDrawCategory.name}...` });
    try {
      await clearDrawData(currentDrawCategory.apiName);
      setData([]); // Clear UI data immediately
      toast({ title: "Données locales effacées", description: "Rechargement des données initiales..." });
      await loadInitialData(currentDrawCategory); // Reload initial data
    } catch (e: any) {
      setError(e.message);
      toast({ variant: "destructive", title: "Erreur lors du nettoyage", description: e.message });
    } finally {
      setLoading(false);
    }
  }, [currentDrawCategory, loadInitialData, toast]);


  return { data, loading, error, currentDrawCategory, refreshData, forceClearAndReload };
}
