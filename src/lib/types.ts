export interface DrawResult {
  id?: number; // Auto-incrementing primary key for IndexedDB
  drawName: string; // This should match the `apiName` from FlatDrawCategory
  date: string; // YYYY-MM-DD
  gagnants: number[]; // Winning numbers
  machine?: number[]; // Machine numbers, now optional
}

export type BallColor = 
  | 'white' | 'blue' | 'orange' | 'green' | 'yellow' 
  | 'pink' | 'indigo' | 'brown' | 'red';

export interface NumberStats {
  number: number;
  winningCount: number;
  machineCount: number;
  totalCount: number;
}

export interface CoOccurrenceStat {
  number: number;
  count: number;
}

export interface ConsultData {
  targetNumber: number;
  coOccurrencesWinning: CoOccurrenceStat[]; // Co-occurrence in same draw, winning numbers
  coOccurrencesMachine: CoOccurrenceStat[]; // Co-occurrence in same draw, machine numbers
  // Could add co-occurrence with next draw if logic is complex and needs specific display
}

