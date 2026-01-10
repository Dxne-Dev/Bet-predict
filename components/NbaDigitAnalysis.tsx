
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { NbaDigitResult, MatchDigitPrediction } from '../types';
import Loader from './Loader';

const NbaDigitAnalysis: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<NbaDigitResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setResult(null);

    try {
      const data = await geminiService.getNbaDigitPrediction(selectedDate);
      if (!data.predictions || data.predictions.length === 0) {
        setError("Aucun match NBA n'a été trouvé.");
      } else {
        setResult(data);
        databaseService.saveEntry({
          sport: 'Basketball',
          mode: 'pro',
          type: 'nba',
          label: `NBA Digit (${selectedDate})`,
          data: data
        });
      }
    } catch (err) {
      setError("Erreur d'analyse.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const ConfidenceBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = {
      'Haute': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Moyenne': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Faible': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[level as keyof typeof colors] || colors.Moyenne}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center p-8 bg-gradient-to-br from-orange-600/20 to-brand-secondary rounded-2xl border border-orange-500/20 shadow-2xl">
        <h2 className="text-4xl font-black text-white tracking-tighter flex items-center justify-center gap-3">
          <span className="bg-orange-600 text-white px-3 py-1 rounded-md transform -rotate-2">NBA</span> 
          CHIFFRE PRÉSENT & TOTAL
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto font-medium">
          Prédiction de l'occurrence numérique dans le score final.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-center">
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Date de la nuit NBA</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
            className="bg-brand-dark border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none w-full" 
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full md:w-auto md:mt-5 bg-orange-600 hover:bg-orange-700 text-white font-black py-3 px-12 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:bg-gray-700"
        >
          {isLoading ? 'SCAN EN COURS...' : 'ANALYSER LA PRÉSENCE'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-bold">
          {error}
        </div>
      )}

      {isLoading && <Loader text="Analyse des occurrences numériques..." />}

      {result && (
        <div className="space-y-6">
          {result.globalTrend && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-blue-300 text-sm italic text-center">
              💡 {result.globalTrend}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.predictions.map((pred, idx) => (
              <div key={idx} className="bg-brand-secondary rounded-2xl border border-gray-700 overflow-hidden transition-all hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(234,88,12,0.1)] flex flex-col">
                <div className="p-4 bg-brand-dark/50 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{pred.match}</span>
                  <ConfidenceBadge level={pred.confidence} />
                </div>
                
                <div className="p-6 flex flex-col items-center text-center flex-grow">
                  <div className="flex justify-around w-full mb-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Chiffre Présent</span>
                        <div className="text-6xl font-black text-white tabular-nums drop-shadow-lg">{pred.predictedDigit}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">Total Est.</span>
                        <div className="text-6xl font-black text-white tabular-nums drop-shadow-lg">{pred.predictedTotalScore}</div>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium bg-brand-dark/30 p-3 rounded-lg border border-gray-800 italic">"{pred.reasoning}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NbaDigitAnalysis;
