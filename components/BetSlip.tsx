import React from 'react';
import { BetSlip as BetSlipType } from '../types';

interface BetSlipProps {
  slip: BetSlipType;
}

const BetSlip: React.FC<BetSlipProps> = ({ slip }) => {
  return (
    <div className="bg-brand-secondary border border-gray-700 rounded-xl overflow-hidden shadow-2xl w-full">
      <div className="p-4 bg-gray-800/50">
        <h3 className="font-bold text-xl text-brand-accent">{slip.title}</h3>
        {slip.analysis && <p className="text-sm text-gray-400 mt-1">{slip.analysis}</p>}
      </div>
      <div className="p-4 flex flex-col gap-3">
        {slip.bets && Array.isArray(slip.bets) && slip.bets.map((bet, index) => (
          <div key={index} className="bg-brand-dark/50 p-3 rounded-lg border-l-4 border-brand-accent">
            <p className="font-semibold text-brand-light">{bet.event}</p>
            <p className="text-gray-300">{bet.market}: <span className="font-bold text-white">{bet.prediction}</span></p>
            {bet.justification && <p className="text-xs text-gray-500 mt-1 italic">"{bet.justification}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BetSlip;