
import React from 'react';
import { Prediction } from '../types';

interface PredictionCardProps {
  prediction: Prediction;
}

const ConfidenceBadge: React.FC<{ confidence: 'Faible' | 'Moyenne' | 'Haute' }> = ({ confidence }) => {
  const confidenceStyles = {
    'Faible': 'bg-red-500/20 text-red-300 ring-red-500/30',
    'Moyenne': 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30',
    'Haute': 'bg-green-500/20 text-green-300 ring-green-500/30',
  };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${confidenceStyles[confidence]}`}>
      Confiance {confidence}
    </span>
  );
};

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  return (
    <div className="bg-brand-secondary border border-gray-700 rounded-lg p-4 flex flex-col gap-3 transition-all hover:border-brand-accent/50 hover:shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-brand-light">{prediction.market}</h3>
        <ConfidenceBadge confidence={prediction.confidence} />
      </div>
      <p className="text-2xl font-black text-brand-accent tracking-wider">{prediction.prediction}</p>
      <p className="text-sm text-gray-400">{prediction.justification}</p>
    </div>
  );
};

export default PredictionCard;
