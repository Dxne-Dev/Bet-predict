
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { Event, Prediction } from '../types';
import Loader from './Loader';
import PredictionCard from './PredictionCard';

const FirstHalfTime: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !teamA.trim() || !teamB.trim() || teamA.trim().toLowerCase() === teamB.trim().toLowerCase()) {
      setError('Veuillez remplir tous les champs et saisir deux équipes différentes.');
      return;
    }
    setError('');
    setIsLoading(true);
    setPredictions(null);

    const event: Event = {
      id: 'first-half-event',
      sport: 'Football', // Hardcoded as this section is only for football
      date: selectedDate,
      teamA: { id: teamA.trim().toLowerCase(), name: teamA.trim() },
      teamB: { id: teamB.trim().toLowerCase(), name: teamB.trim() },
    };

    try {
      const result = await geminiService.getFirstHalfTimePrediction(event);
      if (result.length === 0) {
        setError("Aucun match trouvé pour les équipes et la date sélectionnées, ou pas de prédictions pertinentes pour la 1ère mi-temps. Veuillez vérifier les informations.");
      } else {
        setPredictions(result);
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
       <div className="text-center p-4 bg-brand-secondary/30 rounded-lg">
        <h2 className="text-2xl font-bold text-brand-light">Analyse 1ère Mi-temps - Football</h2>
        <p className="text-gray-400 mt-1">Obtenez des pronostics ciblés exclusivement sur la première période des matchs de football.</p>
       </div>
      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-1">
          <label htmlFor="date-fht" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
          <input type="date" id="date-fht" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="teamA-fht" className="block text-sm font-medium text-gray-300 mb-1">Équipe A</label>
           <input type="text" id="teamA-fht" value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="Saisir l'équipe A" className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="teamB-fht" className="block text-sm font-medium text-gray-300 mb-1">Équipe B</label>
           <input type="text" id="teamB-fht" value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="Saisir l'équipe B" className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <button type="submit" disabled={isLoading} className="lg:col-span-1 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500">
          {isLoading ? 'Analyse...' : 'Lancer l\'Analyse'}
        </button>
      </form>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-center">{error}</div>}
      
      {isLoading && <Loader text="L'IA analyse la première mi-temps..." />}

      {predictions && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Résultats de l'Analyse (1ère Mi-temps)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((p, i) => <PredictionCard key={i} prediction={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstHalfTime;
