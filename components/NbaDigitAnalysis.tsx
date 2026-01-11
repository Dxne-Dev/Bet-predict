
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
      // On prévient l'utilisateur que l'IA cherche sur les sources US
      const data = await geminiService.getNbaDigitPrediction(selectedDate);
      if (!data.predictions || data.predictions.length === 0) {
        setError(`Aucun match NBA n'a été confirmé pour la soirée du ${selectedDate} (heure US). Vérifiez s'il n'y a pas de pause (All-Star Break, etc).`);
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
      setError("Erreur lors de l'interrogation des serveurs de statistiques NBA.");
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
          DIGIT PREDICTOR
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto font-medium">
          Analyse des probabilités d'occurrence numérique dans les scores finaux.
        </p>
        <p className="text-[10px] text-orange-500 font-bold uppercase mt-2">Vérification en temps réel sur sources US (ESPN / NBA.com)</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-center">
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Date du match (Heure USA)</label>
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
          {isLoading ? 'DEEP SEARCH NBA...' : 'VÉRIFIER LE CALENDRIER'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl text-center font-bold">
          <p>{error}</p>
          <p className="text-[10px] mt-2 font-normal opacity-70 italic">Note: Les matchs NBA commencent généralement après minuit en Europe.</p>
        </div>
      )}

      {isLoading && <Loader text="L'IA interroge les calendriers officiels NBA via Google Search..." />}

      {result && (
        <div className="space-y-6">
          {result.globalTrend && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-blue-300 text-sm italic text-center">
              💡 {result.globalTrend}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.predictions.map((pred, idx) => (
              <div key={idx} className="bg-brand-secondary rounded-2xl border border-gray-700 overflow-hidden transition-all hover:border-orange-500/50 flex flex-col shadow-xl">
                <div className="p-4 bg-brand-dark/50 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{pred.match}</span>
                  <ConfidenceBadge level={pred.confidence} />
                </div>
                
                <div className="p-6 flex flex-col items-center text-center flex-grow">
                  <div className="flex justify-around w-full mb-6">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Digit</span>
                        <div className="text-6xl font-black text-white tabular-nums">{pred.predictedDigit}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">Total Score</span>
                        <div className="text-6xl font-black text-white tabular-nums">{pred.predictedTotalScore}</div>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <p className="text-xs text-gray-300 leading-relaxed font-medium bg-brand-dark/30 p-3 rounded-lg border border-gray-800 italic">"{pred.reasoning}"</p>
                    {pred.recentScores && pred.recentScores.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                            {pred.recentScores.map((score, sIdx) => (
                                <span key={sIdx} className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-gray-500">{score}</span>
                            ))}
                        </div>
                    )}
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
