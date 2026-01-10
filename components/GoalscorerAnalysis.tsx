
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { GoalscorerPrediction } from '../types';
import Loader from './Loader';
import GoalscorerCard from './GoalscorerCard';

interface GoalscorerAnalysisProps {
  forceSport?: 'football' | 'hockey';
}

const GoalscorerAnalysis: React.FC<GoalscorerAnalysisProps> = ({ forceSport }) => {
  const [selectedSport, setSelectedSport] = useState<'football' | 'hockey'>(forceSport || 'football');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [predictions, setPredictions] = useState<GoalscorerPrediction[] | null>(null);
  const [resultTitle, setResultTitle] = useState<string>('');

  useEffect(() => {
    if (forceSport) setSelectedSport(forceSport);
  }, [forceSport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Veuillez sélectionner une date.');
      return;
    }
    setError('');
    setIsLoading(true);
    setPredictions(null);
    
    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const scorerTerm = "Buteurs";
    setResultTitle(`Top 5 ${scorerTerm} Potentiels du ${formattedDate}`);

    try {
      const results = await geminiService.getGoalscorerPredictions(selectedDate, selectedSport);
      
      // Filtrage des résultats incomplets au cas où l'IA hallucine des objets vides
      const validResults = results.filter(p => p.playerName && p.playerName !== "-" && p.match);

      if(validResults.length === 0){
          setError(`L'IA n'a trouvé aucune donnée de buteur fiable pour cette date.`);
      } else {
        setPredictions(validResults);
        databaseService.saveEntry({
          sport: selectedSport === 'football' ? 'Football' : 'Hockey',
          mode: 'pro',
          type: 'goalscorer',
          label: `Top Buteurs ${selectedSport} (${selectedDate})`,
          data: validResults
        });
      }
    } catch (err) {
      setError(`Une erreur est survenue lors de la recherche.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sportName = selectedSport === 'football' ? 'Football' : 'Hockey sur Glace';
  const scorerTerm = "Buteurs";

  return (
    <div className="space-y-8">
       <div className="text-center p-6 bg-brand-secondary/30 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-black text-brand-light uppercase tracking-tight">Analyse des {scorerTerm} <span className="text-brand-accent">| {sportName}</span></h2>
        <p className="text-gray-400 mt-1 text-sm font-medium">Probabilités individuelles de score basées sur la forme actuelle.</p>
       </div>

      {!forceSport && (
        <div className="flex justify-center gap-4">
            <button
            onClick={() => { setPredictions(null); setError(''); setSelectedSport('football'); }}
            className={`px-6 py-2 font-bold rounded-md transition-all text-white ${selectedSport === 'football' ? 'bg-brand-accent scale-105 shadow-lg' : 'bg-brand-secondary hover:bg-brand-secondary/70'}`}
            >
            Football
            </button>
            <button
            onClick={() => { setPredictions(null); setError(''); setSelectedSport('hockey'); }}
            className={`px-6 py-2 font-bold rounded-md transition-all text-white ${selectedSport === 'hockey' ? 'bg-brand-accent scale-105 shadow-lg' : 'bg-brand-secondary hover:bg-brand-secondary/70'}`}
            >
            Hockey sur Glace
            </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-center">
        <label htmlFor="date-gs" className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date des Matchs</label>
        <input type="date" id="date-gs" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-dark border-gray-600 text-white rounded-md p-2.5 focus:ring-brand-accent outline-none" />
        <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-8 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:from-gray-500 disabled:to-gray-600">
          {isLoading ? 'RECHERCHE...' : `TROUVER LES ${scorerTerm.toUpperCase()}`}
        </button>
      </form>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-center font-bold border border-red-500/30">{error}</div>}
      
      {isLoading && <Loader text={`L'IA recherche les ${scorerTerm.toLowerCase()}...`} />}

      {predictions && (
        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tighter uppercase">{resultTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {predictions.map((p, i) => <GoalscorerCard key={i} prediction={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalscorerAnalysis;
