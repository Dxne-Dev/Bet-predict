
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { NbaProphecyResult } from '../types';
import Loader from './Loader';

const NbaProphecy: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<NbaProphecyResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setResult(null);

    try {
      const data = await geminiService.getNbaProphecy(selectedDate);
      if (!data.recommendations || data.recommendations.length === 0) {
        setError(`Aucune opportunité ne valide les 3 critères stricts (Héros, Faille, Scénario) pour le ${selectedDate}. L'IA préfère s'abstenir plutôt que de proposer des paris risqués.`);
      } else {
        setResult(data);
        databaseService.saveEntry({
          sport: 'Basketball',
          mode: 'pro',
          type: 'nba_prophecy',
          label: `La Prophétie NBA (${selectedDate})`,
          data: data
        });
      }
    } catch (err) {
      setError("Erreur lors de l'audit expert. Vérifiez votre connexion.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="relative p-10 lg:p-14 bg-gradient-to-br from-gray-900 via-[#1a120b] to-black rounded-[3rem] border border-amber-600/30 shadow-[0_0_60px_rgba(217,119,6,0.15)] text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            Algorithme des 3 Clés
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-none">
            LA PROPHÉTIE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-700">NBA</span>
          </h2>
          
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium leading-relaxed mb-8">
             L'IA applique un filtre impitoyable pour isoler les anomalies statistiques :
             <br />
             <span className="text-white font-bold">1. Le Héros</span> (USG% &gt; 30) • 
             <span className="text-white font-bold"> 2. La Faille</span> (Bottom 7 DvP) • 
             <span className="text-white font-bold"> 3. Le Scénario</span> (Hist. &gt; 85%)
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 bg-white/5 p-2 pr-2 md:pr-2 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:border-amber-500/30">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="bg-transparent text-white font-bold px-6 py-3 rounded-xl focus:outline-none focus:bg-white/5"
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-amber-600 hover:bg-amber-500 text-white font-black px-8 py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Audit en cours...' : 'Lancer l\'Oracle'}
            </button>
          </form>
          
           <div className="mt-8 flex gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
             <span>• Impartialité Totale</span>
             <span>• Audit Google Search</span>
             <span>• Value Check</span>
           </div>
        </div>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto bg-brand-secondary/50 border border-red-500/20 p-8 rounded-3xl text-center">
          <svg className="w-10 h-10 text-red-500/50 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 font-bold mb-2">{error}</p>
          <p className="text-xs text-gray-500 italic">L'IA ne force jamais une prédiction si les données ne convergent pas parfaitement.</p>
        </div>
      )}

      {isLoading && <Loader text="Vérification stricte : USG%, DvP Rank et Value implicite..." />}

      {result && result.recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-12 max-w-5xl mx-auto">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="group relative bg-[#121212] rounded-[3rem] border border-gray-800 hover:border-amber-500/50 transition-all duration-500 overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] group-hover:bg-amber-600/20 transition-all"></div>

              <div className="relative p-8 md:p-12">
                {/* Header Card */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 border-b border-gray-800 pb-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Top Pick #{idx + 1}</span>
                       <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{rec.match}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">{rec.player}</h3>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-xs text-gray-400 font-bold uppercase">Confiance {rec.confidenceLevel} ({rec.confidencePercent}%)</span>
                        </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 text-center min-w-[220px] shadow-xl group-hover:scale-105 transition-transform duration-300">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Recommandation</p>
                      <div className="text-xl md:text-2xl font-black text-white mb-2 uppercase leading-none">{rec.bet}</div>
                      <div className="flex items-center justify-center gap-2 bg-black/30 py-1 px-3 rounded-lg mx-auto w-fit">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">Cote Moy.</span>
                         <span className="text-base font-black text-brand-accent tabular-nums">{rec.odds}</span>
                      </div>
                  </div>
                </div>

                {/* The 3 Keys Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* KEY 1 */}
                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 relative overflow-hidden group-hover:border-amber-500/20 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.516L20.297 19H3.703L12 5.516z"/></svg>
                        </div>
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">1. Le Héros (USG%)</h4>
                        <div className="text-3xl font-black text-white mb-2">{rec.hero.usg}</div>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{rec.hero.detail}</p>
                    </div>

                    {/* KEY 2 */}
                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 relative overflow-hidden group-hover:border-amber-500/20 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        </div>
                        <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">2. La Faille (DvP)</h4>
                        <div className="text-3xl font-black text-white mb-2">{rec.faille.dvp}</div>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{rec.faille.detail}</p>
                    </div>

                    {/* KEY 3 */}
                    <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 relative overflow-hidden group-hover:border-amber-500/20 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
                        </div>
                        <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-4">3. Le Scénario</h4>
                        <div className="text-3xl font-black text-white mb-2">{rec.scenario.history}</div>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{rec.scenario.detail}</p>
                    </div>
                </div>

                {/* Value Analysis Section */}
                <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                            %
                        </div>
                        <div>
                            <h5 className="text-xs font-black text-white uppercase tracking-widest">Analyse de Value</h5>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">Comparaison Probabilités</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Estim. IA</p>
                            <p className="text-xl font-black text-white">{rec.valueAnalysis?.estimatedProbability || "N/A"}</p>
                        </div>
                        <div className="h-auto w-px bg-gray-700"></div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Implicite Book</p>
                            <p className="text-xl font-black text-gray-400">{rec.valueAnalysis?.impliedOdds || "N/A"}</p>
                        </div>
                         <div className="h-auto w-px bg-gray-700"></div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Value Edge</p>
                            <p className="text-xl font-black text-green-400">{rec.valueAnalysis?.valueEdge || "N/A"}</p>
                        </div>
                     </div>
                </div>

                {/* Detailed Stats Table */}
                <div className="border-t border-gray-800 pt-8">
                    <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                        Preuve par l'Historique (Matchs Similaires)
                    </h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-gray-800">
                                    <th className="pb-3 pl-2">Date</th>
                                    <th className="pb-3">Adversaire</th>
                                    <th className="pb-3 text-amber-500">Performance Clé</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-gray-300">
                                {rec.scenario.stats.map((stat, i) => (
                                    <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                        <td className="py-3 pl-2">{stat.date}</td>
                                        <td className="py-3">{stat.opponent}</td>
                                        <td className="py-3 font-bold text-white">{stat.stat}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Risks & Sources */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-end gap-4 text-[10px] text-gray-500">
                     <div className="max-w-md">
                        <span className="font-black text-red-400 uppercase tracking-widest mr-2">Risques :</span>
                        {rec.risks}
                     </div>
                     <div className="flex gap-2 opacity-50">
                        {result.sources.slice(0, 3).map((s, i) => (
                            <span key={i} className="border border-gray-700 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                     </div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center p-8 opacity-50">
             <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">© Audit IA Générative • Ne pariez que ce que vous pouvez perdre • 18+</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NbaProphecy;
