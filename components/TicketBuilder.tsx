
import React, { useState, useEffect } from 'react';
import { sportsDataService } from '../services/sportsDataService';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Sport, BetSlip as BetSlipType } from '../types';
import Loader from './Loader';
import BetSlip from './BetSlip';

interface TicketBuilderProps {
  defaultSportId?: string;
}

const TicketBuilder: React.FC<TicketBuilderProps> = ({ defaultSportId }) => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>(defaultSportId || '');
  const [eventCount, setEventCount] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [betSlip, setBetSlip] = useState<BetSlipType | null>(null);

  useEffect(() => {
    sportsDataService.getSports().then(setSports);
  }, []);

  useEffect(() => {
    if (defaultSportId) setSelectedSport(defaultSportId);
  }, [defaultSportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport || !startDate || eventCount < 2) {
      setError('Veuillez remplir tous les champs et sélectionner au moins 2 événements.');
      return;
    }
    setError('');
    setIsLoading(true);
    setBetSlip(null);

    const sportName = sports.find(s => s.id === selectedSport)?.name || '';

    try {
      const result = await geminiService.buildTicket(
        sportName,
        eventCount,
        `à partir du ${startDate}`
      );
      
      if (result && result.bets && result.bets.length > 0) {
        setBetSlip(result);
        databaseService.saveEntry({
          sport: sportName,
          mode: 'pro',
          type: 'ticket',
          label: `Ticket ${eventCount} matchs (${startDate})`,
          data: result
        });
      } else {
        setError("L'IA n'a pas pu générer de paris valides pour cette sélection.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la création du ticket.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-xl border border-gray-700 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="sport-tb" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Sport</label>
          <select id="sport-tb" value={selectedSport} onChange={e => setSelectedSport(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-brand-accent outline-none">
            <option value="">Sélectionner...</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label htmlFor="eventCount" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nb. d'Événements</label>
          <input type="number" id="eventCount" value={eventCount} onChange={e => setEventCount(parseInt(e.target.value, 10))} min="2" max="10" className="w-full bg-brand-dark border-gray-600 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-brand-accent outline-none" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="date-tb" className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">À partir du</label>
          <input type="date" id="date-tb" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-brand-accent outline-none" />
        </div>
        <button type="submit" disabled={isLoading} className="md:col-span-1 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-black py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:bg-gray-700 disabled:transform-none">
          {isLoading ? 'CONSTRUCTION...' : 'CONSTRUIRE LE TICKET'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center font-bold">
          {error}
        </div>
      )}
      
      {isLoading && <Loader text="L'IA recherche les meilleurs paris en temps réel..." />}

      {betSlip && (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-6 text-center text-white tracking-tight uppercase">Votre Ticket Personnalisé</h2>
            <div className="max-w-2xl mx-auto">
                <BetSlip slip={betSlip} />
            </div>
        </div>
      )}
    </div>
  );
};

export default TicketBuilder;
