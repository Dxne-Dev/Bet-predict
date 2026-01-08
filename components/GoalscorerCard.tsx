import React from 'react';
import { GoalscorerPrediction } from '../types';

interface GoalscorerCardProps {
  prediction: GoalscorerPrediction;
}

const ConfidenceBadge: React.FC<{ confidence: 'Haute' }> = ({ confidence }) => {
  const confidenceStyles = {
    'Haute': 'bg-green-500/20 text-green-300 ring-green-500/30',
  };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${confidenceStyles[confidence]}`}>
      Confiance {confidence}
    </span>
  );
};

const GoalscorerCard: React.FC<GoalscorerCardProps> = ({ prediction }) => {
  return (
    <div className="bg-brand-secondary border border-gray-700 rounded-lg p-4 flex flex-col gap-3 transition-all hover:border-brand-accent/50 hover:shadow-lg hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-black text-2xl text-brand-accent flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
             {prediction.playerName}
          </h3>
          <p className="text-sm text-gray-400 font-semibold">{prediction.teamName} - <span className="font-normal italic">{prediction.league}</span></p>
        </div>
        <ConfidenceBadge confidence={prediction.confidence} />
      </div>
      <div className="bg-brand-dark/50 p-2 rounded-md">
         <p className="text-sm text-gray-300">Match: <span className="font-bold text-white">{prediction.match}</span></p>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{prediction.justification}</p>
    </div>
  );
};

export default GoalscorerCard;