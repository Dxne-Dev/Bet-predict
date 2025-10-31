import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
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
      setBetSlips(results);
    } catch (err) {
      setError("Une erreur est survenue lors de la génération des méga-paris. Veuillez réessayer.");
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
      setBetSlips(results);
    } catch (err) {
      setError("Une erreur est survenue lors de la récupération des recommandations. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-brand-secondary p-6 rounded-lg shadow-lg space-y-4">
          <form onSubmit={handleDateSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <label htmlFor="date-mb" className="text-lg font-medium text-gray-300">Date des Paris :</label>
            <input type="date" id="date-mb" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
            <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-md transition-all disabled:from-gray-500 disabled:to-gray-600">
              {isLoading ? 'Génération...' : 'Générer par Date'}
            </button>
          </form>
          
          <div className="flex items-center text-gray-400">
              <hr className="flex-grow border-gray-600"/>
              <span className="px-4 text-sm font-semibold">OU</span>
              <hr className="flex-grow border-gray-600"/>
          </div>

          <div className="flex justify-center">
               <button onClick={handleRecommendation} disabled={isLoading} className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-all disabled:from-gray-500 disabled:to-gray-600">
                  {isLoading ? 'Analyse...' : "Recommandation de l'IA"}
               </button>
          </div>
      </div>


      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-center">{error}</div>}
      
      {isLoading && <Loader text="L'IA concocte des combinés explosifs..." />}

      {betSlips && (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{resultTitle}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {betSlips.map((slip, i) => <BetSlip key={i} slip={slip} />)}
            </div>
        </div>
      )}
    </div>
  );
};

export default MegaBets;