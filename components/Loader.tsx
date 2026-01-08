
import React, { useState, useEffect } from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "L'IA analyse les données..." }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Vérification des feuilles de match...",
    "Analyse des historiques de rencontres...",
    "Scan des dernières news sportives via Google Search...",
    "Calcul des probabilités algorithmiques...",
    "Optimisation du ticket final..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-secondary/40 rounded-2xl border border-white/5 backdrop-blur-sm animate-pulse">
      <div className="relative mb-6">
        <svg className="animate-spin h-16 w-16 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-brand-accent uppercase">AI</span>
        </div>
      </div>
      <h3 className="text-xl font-black text-brand-light mb-2">{text}</h3>
      <div className="h-6 overflow-hidden">
        <p className="text-sm text-brand-accent font-medium animate-bounce">
          {tips[tipIndex]}
        </p>
      </div>
      <p className="text-xs text-gray-500 mt-6 max-w-xs mx-auto">
        La recherche en temps réel garantit des pronostics basés sur les dernières actualités. Merci de votre patience.
      </p>
    </div>
  );
};

export default Loader;
