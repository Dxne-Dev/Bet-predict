
import React, { useState, useEffect } from 'react';
import { sportsDataService } from '../services/sportsDataService';
import { geminiService } from '../services/geminiService';
import { Sport, Team, Event, Prediction } from '../types';
import Loader from './Loader';
import PredictionCard from './PredictionCard';

interface SingleEventAnalysisProps {
  defaultSportId?: string;
}

const SingleEventAnalysis: React.FC<SingleEventAnalysisProps> = ({ defaultSportId }) => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>(defaultSportId || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);

  useEffect(() => {
    sportsDataService.getSports().then(setSports);
  }, []);

  useEffect(() => {
    if (defaultSportId) setSelectedSport(defaultSportId);
  }, [defaultSportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport || !selectedDate || !teamA.trim() || !teamB.trim() || teamA.trim().toLowerCase() === teamB.trim().toLowerCase()) {
      setError('Veuillez remplir tous les champs et saisir deux équipes différentes.');
      return;
    }
    setError('');
    setIsLoading(true);
    setPredictions(null);

    const event: Event = {
      id: 'single-event',
      sport: sports.find(s => s.id === selectedSport)?.name || '',
      date: selectedDate,
      teamA: { id: teamA.trim().toLowerCase(), name: teamA.trim() },
      teamB: { id: teamB.trim().toLowerCase(), name: teamB.trim() },
    };

    try {
      const result = await geminiService.getSingleEventPrediction(event);
      if (result.length === 0) {
        setError("Aucun match trouvé pour les équipes et la date sélectionnées. Veuillez vérifier les informations.");
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
      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end border border-gray-700">
        <div className="lg:col-span-1">
          <label htmlFor="sport" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Sport</label>
          <select id="sport" value={selectedSport} onChange={e => setSelectedSport(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent">
            <option value="">Sélectionner...</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="date" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Date</label>
          <input type="date" id="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="teamA" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Équipe A</label>
           <input type="text" id="teamA" value={teamA} onChange={e => setTeamA(e.target.value)} disabled={!selectedSport} placeholder="Ex: PSG" className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent disabled:opacity-50" />
        </div>
        <div className="lg:col-span-1">
          <label htmlFor="teamB" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Équipe B</label>
           <input type="text" id="teamB" value={teamB} onChange={e => setTeamB(e.target.value)} disabled={!selectedSport} placeholder="Ex: Marseille" className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent disabled:opacity-50" />
        </div>
        <button type="submit" disabled={isLoading} className="lg:col-span-1 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-black py-2.5 px-4 rounded-md transition-all transform hover:scale-[1.02] active:scale-95 disabled:bg-gray-500">
          {isLoading ? 'ANALYSE...' : 'LANCER'}
        </button>
      </form>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md text-center font-bold">{error}</div>}
      
      {isLoading && <Loader />}

      {predictions && (
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-black mb-6 text-center uppercase tracking-tight">Pronostics <span className="text-brand-accent">Match</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((p, i) => <PredictionCard key={i} prediction={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleEventAnalysis;
