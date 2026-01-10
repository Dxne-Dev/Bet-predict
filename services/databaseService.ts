
import { HistoryEntry, AppMode } from '../types';

const STORAGE_KEY = 'sport_ai_predictions_history';

export const databaseService = {
  saveEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry => {
    const history = databaseService.getAllHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const updatedHistory = [newEntry, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory.slice(0, 100)));
    return newEntry;
  },

  getAllHistory: (): HistoryEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getHistoryByMode: (mode: AppMode): HistoryEntry[] => {
    return databaseService.getAllHistory().filter(e => e.mode === mode);
  },

  updateEntry: (id: string, updates: Partial<HistoryEntry>): void => {
    const history = databaseService.getAllHistory();
    const index = history.findIndex(e => e.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  },

  deleteEntry: (id: string): void => {
    const history = databaseService.getAllHistory();
    const updatedHistory = history.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  },

  clearHistoryByMode: (mode: AppMode): void => {
    const history = databaseService.getAllHistory();
    const filteredHistory = history.filter(e => e.mode !== mode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
  },

  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.clear(); // Vide tout le localstorage par sécurité comme demandé
  }
};
