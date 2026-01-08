
import React from 'react';
import { Sport } from '../types';

interface ProPlusSelectorProps {
  sports: Sport[];
  onSelect: (sport: Sport) => void;
}

const ProPlusSelector: React.FC<ProPlusSelectorProps> = ({ sports, onSelect }) => {
  const getSportVisuals = (id: string) => {
    switch (id) {
      case 'football':
        return { 
            icon: '⚽', 
            color: 'from-green-600 to-green-900', 
            tagline: 'Dominez les pelouses' 
        };
      case 'basketball':
        return { 
            icon: '🏀', 
            color: 'from-orange-500 to-orange-800', 
            tagline: 'Expertise parquets' 
        };
      case 'tennis':
        return { 
            icon: '🎾', 
            color: 'from-yellow-400 to-yellow-700', 
            tagline: 'Service gagnant' 
        };
      case 'nhl':
        return { 
            icon: '🏒', 
            color: 'from-blue-500 to-blue-800', 
            tagline: 'Puissance sur glace' 
        };
      case 'esports':
        return { 
            icon: '🎮', 
            color: 'from-purple-600 to-purple-900', 
            tagline: 'Analyse numérique' 
        };
      default:
        return { 
            icon: '🏆', 
            color: 'from-gray-600 to-gray-800', 
            tagline: 'Tous les terrains' 
        };
    }
  };

  return (
    <div className="py-8 animate-fade-in space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase">
            Choisissez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-blue-500">Arène</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto font-medium">
            Le mode PRO++ personnalise l'expérience IA selon la discipline sélectionnée pour des analyses encore plus pointues.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {sports.map((sport) => {
          const visuals = getSportVisuals(sport.id);
          return (
            <button
              key={sport.id}
              onClick={() => onSelect(sport)}
              className="group relative overflow-hidden rounded-3xl aspect-[3/4] transition-all transform hover:scale-[1.03] active:scale-95 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${visuals.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all" />
              
              {/* Content */}
              <div className="relative h-full p-8 flex flex-col justify-between items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-md group-hover:scale-110 transition-transform">
                  {visuals.icon}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {sport.name}
                  </h3>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    {visuals.tagline}
                  </p>
                </div>
                
                <div className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black py-2 px-6 rounded-full border border-white/20 transition-colors uppercase tracking-widest">
                  Entrer
                </div>
              </div>

              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProPlusSelector;
