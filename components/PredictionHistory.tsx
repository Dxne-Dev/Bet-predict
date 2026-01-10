
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { geminiService } from '../services/geminiService';
import { HistoryEntry, AppMode } from '../types';
import Loader from './Loader';

interface PredictionHistoryProps {
  mode: AppMode;
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ mode }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  useEffect(() => {
    const data = databaseService.getHistoryByMode(mode);
    setHistory(data);
  }, [mode]);

  const handleVerify = async (entry: HistoryEntry) => {
    const matchDateStr = entry.label.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    const matchDate = matchDateStr ? new Date(matchDateStr) : null;
    const now = new Date();
    
    if (matchDate && matchDate > now && !confirm("Attention : Ce match est dans le futur. L'IA risque de ne trouver aucun résultat. Voulez-vous continuer ?")) {
      return;
    }

    setIsVerifying(entry.id);
    try {
      const result = await geminiService.verifyPredictionResult(entry);
      databaseService.updateEntry(entry.id, {
        verification: {
          ...result,
          verifiedAt: Date.now()
        }
      });
      setHistory(databaseService.getHistoryByMode(mode));
    } catch (error) {
      console.error("Erreur de vérification:", error);
      alert("Erreur de communication avec l'IA d'audit.");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDelete = (id: string) => {
    const firstCheck = confirm("Voulez-vous vraiment supprimer cette entrée de votre historique ?");
    if (firstCheck) {
      const secondCheck = confirm("ATTENTION : Cette action est définitive. Êtes-vous certain de vouloir l'effacer ?");
      if (secondCheck) {
        databaseService.deleteEntry(id);
        setHistory(databaseService.getHistoryByMode(mode));
      }
    }
  };

  const handleClearMode = () => {
    const modeLabel = mode === 'proPlus' ? 'PRO++' : 'PRO';
    if (confirm(`Voulez-vous vider l'historique ${modeLabel} uniquement ?`)) {
      databaseService.clearHistoryByMode(mode);
      setHistory([]);
    }
  };

  const handleFullReset = () => {
    const firstCheck = confirm("DANGER : Voulez-vous vider l'intégralité du stockage local (LocalStorage) ?\n\nCela supprimera TOUT l'historique PRO et PRO++, ainsi que vos paramètres.");
    if (firstCheck) {
      const secondCheck = confirm("Êtes-vous ABSOLUMENT certain ? Cette action est irréversible et effacera toutes vos données de prédiction.");
      if (secondCheck) {
        databaseService.clearAll();
        setHistory([]);
        alert("L'application a été réinitialisée. Le stockage local est vide.");
        window.location.reload(); // Recharger pour assurer un état propre
      }
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-full max-w-2xl bg-brand-secondary/20 rounded-[3rem] border border-dashed border-gray-800 p-20 flex flex-col items-center text-center">
          <div className="bg-gray-800/50 p-6 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-sm">Aucun pronostic {mode === 'proPlus' ? 'PRO++' : 'PRO'} enregistré</p>
        </div>
        
        <div className="mt-12 w-full max-w-2xl bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
            <h4 className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Maintenance du Système</h4>
            <button 
              onClick={handleFullReset}
              className="px-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest"
            >
              Réinitialisation Totale (LocalStorage)
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Historique <span className="text-brand-accent">{mode === 'proPlus' ? 'PRO++' : 'PRO'}</span></h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">Analyse Post-Match</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 bg-brand-dark/50 px-4 py-2 rounded-xl border border-gray-800">{history.length} Entrées</span>
          <button 
            onClick={handleClearMode}
            className="text-[10px] font-black text-gray-400 hover:text-white px-4 py-2 rounded-xl border border-gray-800 transition-all"
          >
            VIDER {mode === 'proPlus' ? 'PRO++' : 'PRO'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {history.map((entry) => {
          const matchDateStr = entry.label.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
          const isFuture = matchDateStr ? new Date(matchDateStr) > new Date() : false;
          
          let statusLabel = "VÉRIFIER";
          let statusColor = "bg-brand-accent";
          
          if (entry.verification) {
            if (entry.verification.isSuccess === true) {
              statusLabel = "SUCCÈS";
              statusColor = "bg-green-500/10 border-green-500/30 text-green-400";
            } else if (entry.verification.isSuccess === false) {
              statusLabel = "ÉCHEC";
              statusColor = "bg-red-500/10 border-red-500/30 text-red-400";
            } else {
              statusLabel = "EN ATTENTE";
              statusColor = "bg-blue-500/10 border-blue-500/30 text-blue-400";
            }
          }

          return (
            <div key={entry.id} className="group bg-brand-secondary border border-gray-800 rounded-[2rem] overflow-hidden hover:border-gray-600 transition-all shadow-xl">
              <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-6">
                  <div className="h-14 w-14 bg-brand-dark rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-800">
                    {entry.sport.toLowerCase().includes('foot') ? '⚽' : '🏆'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[9px] font-black bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full uppercase border border-brand-accent/20">{entry.type}</span>
                      {isFuture && <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase border border-blue-500/20">Futur</span>}
                    </div>
                    <h3 className="text-xl font-black text-white group-hover:text-brand-accent transition-colors">{entry.label}</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tight opacity-60">
                      Généré le {new Date(entry.timestamp).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {entry.verification ? (
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${statusColor}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{statusLabel}</span>
                      <div className={`w-3 h-3 rounded-full ${entry.verification.isSuccess === true ? 'bg-green-400 animate-pulse' : entry.verification.isSuccess === false ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerify(entry)}
                      disabled={isVerifying !== null}
                      className="bg-brand-accent hover:bg-brand-accent-hover text-white px-6 py-3 rounded-2xl text-[10px] font-black transition-all disabled:opacity-50"
                    >
                      {isVerifying === entry.id ? 'AUDIT...' : 'VÉRIFIER'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(entry.id)} className="p-4 text-gray-700 hover:text-red-500 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {entry.verification && (
                <div className="px-8 pb-8 pt-4 border-t border-gray-800/50 bg-brand-dark/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Données Réelles</h4>
                      <div className="text-sm bg-brand-dark/50 p-4 rounded-2xl border border-gray-800 text-gray-300 leading-relaxed">
                        {entry.verification.actualResults}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Comparaison IA</h4>
                      <div className="text-sm bg-brand-accent/5 p-4 rounded-2xl border border-brand-accent/10 text-brand-accent italic leading-relaxed">
                        {entry.verification.comparison}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-20 border-t border-gray-900 pt-10">
        <div className="bg-brand-secondary/30 rounded-3xl p-8 border border-red-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Paramètres de Maintenance</h4>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Action irréversible sur le stockage local</p>
            </div>
          </div>
          
          <button 
            onClick={handleFullReset}
            className="w-full md:w-auto px-8 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest"
          >
            Vider LocalStorage & Historique Complet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictionHistory;
