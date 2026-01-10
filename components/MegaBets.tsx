
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { BetSlip as BetSlipType } from '../types';
import Loader from './Loader';
import BetSlip from './BetSlip';

const MegaBets: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [betSlips, setBetSlips] = useState<BetSlipType[] | null>(null);
  const [resultTitle, setResultTitle] = useState<string>('');

  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Veuillez sélectionner une date.');
      return;
    }
    setError('');
    setIsLoading(true);
    setBetSlips(null);
    setResultTitle(`Propositions de Méga-Paris pour le ${selectedDate}`);

    try {
      const results = await geminiService.generateMegaBets(selectedDate);
      if (results && results.length > 0) {
        setBetSlips(results);
        databaseService.saveEntry({
          sport: 'Multi-Sports',
          mode: 'pro',
          type: 'mega',
          label: `Méga-Paris (${selectedDate})`,
          data: results
        });
      } else {
        setError("L'IA n'a retourné aucun ticket. Veuillez réessayer.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la génération des méga-paris.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecommendation = async () => {
    setError('');
    setIsLoading(true);
    setBetSlips(null);
    setResultTitle("Recommandations de l'IA");

    try {
      const results = await geminiService.getAiRecommendation();
      if (results && results.length > 0) {
        setBetSlips(results);
        databaseService.saveEntry({
          sport: 'Opportunités IA',
          mode: 'pro',
          type: 'mega',
          label: `Recommandations IA (${new Date().toLocaleDateString()})`,
          data: results
        });
      } else {
        setError("L'IA n'a pas trouvé d'opportunités suffisantes pour le moment.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la récupération des recommandations.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-brand-secondary p-6 rounded-lg shadow-lg space-y-4 border border-gray-700">
          <form onSubmit={handleDateSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <label htmlFor="date-mb" className="text-sm font-bold text-gray-400 uppercase tracking-widest">Date des Paris :</label>
            <input type="date" id="date-mb" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent outline-none" />
            <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black py-2 px-8 rounded-md transition-all disabled:opacity-50">
              {isLoading ? 'GÉNÉRATION...' : 'GÉNÉRER PAR DATE'}
            </button>
          </form>
          
          <div className="flex items-center text-gray-700">
              <hr className="flex-grow border-gray-800"/>
              <span className="px-4 text-[10px] font-black uppercase tracking-widest">OU</span>
              <hr className="flex-grow border-gray-800"/>
          </div>

          <div className="flex justify-center">
               <button onClick={handleRecommendation} disabled={isLoading} className="w-full md:w-auto bg-teal-600 hover:bg-teal-500 text-white font-black py-3 px-12 rounded-lg transition-all shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 uppercase tracking-widest text-xs">
                  {isLoading ? 'ANALYSE...' : "Recommandation de l'IA"}
               </button>
          </div>
      </div>


      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center font-bold animate-shake">{error}</div>}
      
      {isLoading && <Loader text="L'IA concocte des combinés explosifs..." />}

      {betSlips && (
        <div className="animate-fade-in space-y-8">
            <div className="relative py-4 text-center">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl inline-block relative z-10">
                    {resultTitle}
                </h2>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 blur-3xl -z-0"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {betSlips.map((slip, i) => (
                    <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                        <BetSlip slip={slip} />
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default MegaBets;
