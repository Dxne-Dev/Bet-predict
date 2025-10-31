import React, { useState, useEffect } from 'react';
import { sportsDataService } from '../services/sportsDataService';
import { geminiService } from '../services/geminiService';
import { Sport, BetSlip as BetSlipType } from '../types';
import Loader from './Loader';
import BetSlip from './BetSlip';

const TicketBuilder: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [eventCount, setEventCount] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [betSlip, setBetSlip] = useState<BetSlipType | null>(null);

  useEffect(() => {
    sportsDataService.getSports().then(setSports);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport || !startDate || eventCount < 2) {
      setError('Veuillez remplir tous les champs et sélectionner au moins 2 événements.');
      return;
    }
    setError('');
    setIsLoading(true);
    setBetSlip(null);

    try {
      const result = await geminiService.buildTicket(
        sports.find(s => s.id === selectedSport)?.name || '',
        eventCount,
        `à partir du ${startDate}`
      );
      setBetSlip(result);
    } catch (err) {
      setError("Une erreur est survenue lors de la création du ticket. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="sport-tb" className="block text-sm font-medium text-gray-300 mb-1">Sport</label>
          <select id="sport-tb" value={selectedSport} onChange={e => setSelectedSport(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent">
            <option value="">Sélectionner...</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label htmlFor="eventCount" className="block text-sm font-medium text-gray-300 mb-1">Nb. d'Événements</label>
          <input type="number" id="eventCount" value={eventCount} onChange={e => setEventCount(parseInt(e.target.value, 10))} min="2" max="10" className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="date-tb" className="block text-sm font-medium text-gray-300 mb-1">À partir du</label>
          <input type="date" id="date-tb" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-dark border-gray-600 text-white rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent" />
        </div>
        <button type="submit" disabled={isLoading} className="md:col-span-1 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500">
          {isLoading ? 'Construction...' : 'Construire le Ticket'}
        </button>
      </form>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-center">{error}</div>}
      
      {isLoading && <Loader text="L'IA recherche les meilleurs paris..." />}

      {betSlip && (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Votre Ticket Personnalisé</h2>
            <div className="max-w-2xl mx-auto">
                <BetSlip slip={betSlip} />
            </div>
        </div>
      )}
    </div>
  );
};

export default TicketBuilder;
