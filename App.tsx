
import React, { useState, useEffect } from 'react';
import SingleEventAnalysis from './components/SingleEventAnalysis';
import TicketBuilder from './components/TicketBuilder';
import MegaBets from './components/MegaBets';
import FirstHalfTime from './components/FirstHalfTime';
import GoalscorerAnalysis from './components/GoalscorerAnalysis';
import NbaDigitAnalysis from './components/NbaDigitAnalysis';
import ProPlusSelector from './components/ProPlusSelector';
import BestChoiceAnalyst from './components/BestChoiceAnalyst';
import { Sport } from './types';
import { sportsDataService } from './services/sportsDataService';

type Tab = 'single' | 'builder' | 'mega' | 'firstHalf' | 'goalscorer' | 'nbaDigit';
type Mode = 'pro' | 'proPlus';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const [mode, setMode] = useState<Mode>('pro');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    sportsDataService.getSports().then(setSports);
  }, []);

  const renderProContent = () => {
    switch (activeTab) {
      case 'single':
        return <SingleEventAnalysis />;
      case 'builder':
        return <TicketBuilder />;
      case 'mega':
        return <MegaBets />;
      case 'firstHalf':
        return <FirstHalfTime />;
      case 'goalscorer':
        return <GoalscorerAnalysis />;
      case 'nbaDigit':
        return <NbaDigitAnalysis />;
      default:
        return null;
    }
  };

  const renderProPlusContent = () => {
    if (!selectedSport) {
      return (
        <ProPlusSelector 
          sports={sports} 
          onSelect={(sport) => setSelectedSport(sport)} 
        />
      );
    }

    // Le mode Pro++ est maintenant l'Analyste Meilleurs Choix
    return (
      <BestChoiceAnalyst 
        sport={selectedSport} 
        onBack={() => setSelectedSport(null)} 
      />
    );
  };
  
  const TabButton: React.FC<{tabId: Tab; currentTab: Tab; onClick: (tab: Tab) => void; children: React.ReactNode}> = ({tabId, currentTab, onClick, children}) => {
      const isActive = tabId === currentTab;
      return (
        <button
            onClick={() => onClick(tabId)}
            className={`px-4 py-2 text-sm md:text-base font-medium rounded-t-lg transition-colors focus:outline-none ${
            isActive
                ? 'bg-brand-secondary text-brand-accent border-b-2 border-brand-accent'
                : 'text-gray-400 hover:text-white'
            }`}
        >
            {children}
        </button>
      )
  }

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-brand-light">
      <header className="bg-brand-secondary/50 shadow-lg p-4 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L10 11.586l3.293-3.293a1 1 0 011.414 0L17.586 11H14a1 1 0 110-2h-2z" clipRule="evenodd" />
                    <path d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 10-2 0v6H5V5h6a1 1 0 100-2H3z" />
                </svg>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">
                        Pronostics Sportifs <span className="text-brand-accent italic">IA</span>
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">L'excellence prédictive</p>
                </div>
            </div>

            <div className="flex items-center bg-brand-dark/50 p-1 rounded-full border border-gray-700">
                <button 
                    onClick={() => setMode('pro')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${mode === 'pro' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    PRO
                </button>
                <button 
                    onClick={() => setMode('proPlus')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 ${mode === 'proPlus' ? 'bg-gradient-to-r from-brand-accent to-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    PRO++
                    {mode === 'proPlus' && <span className="animate-pulse">✨</span>}
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 min-h-[70vh]">
        {mode === 'pro' ? (
            <>
                <div className="border-b border-gray-700 mb-8 overflow-x-auto">
                    <nav className="-mb-px flex space-x-2 md:space-x-8 min-w-max justify-center" aria-label="Tabs">
                        <TabButton tabId="single" currentTab={activeTab} onClick={setActiveTab}>Analyses</TabButton>
                        <TabButton tabId="builder" currentTab={activeTab} onClick={setActiveTab}>Tickets</TabButton>
                        <TabButton tabId="mega" currentTab={activeTab} onClick={setActiveTab}>Méga-Paris</TabButton>
                        <TabButton tabId="firstHalf" currentTab={activeTab} onClick={setActiveTab}>1ère MT</TabButton>
                        <TabButton tabId="goalscorer" currentTab={activeTab} onClick={setActiveTab}>Buteurs</TabButton>
                        <TabButton tabId="nbaDigit" currentTab={activeTab} onClick={setActiveTab}>NBA Digit</TabButton>
                    </nav>
                </div>
                <div className="max-w-7xl mx-auto">{renderProContent()}</div>
            </>
        ) : (
            <div className="max-w-7xl mx-auto">{renderProPlusContent()}</div>
        )}
      </main>

       <footer className="text-center p-8 mt-12 border-t border-gray-900 bg-brand-secondary/20">
            <div className="flex justify-center flex-wrap gap-4 md:gap-6 mb-4 opacity-50">
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Intelligence Artificielle</span>
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Big Data Sports</span>
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Algorithmes Prédictifs</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Pronostics Sportifs IA. Tous droits réservés.</p>
            <p className="text-[10px] text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
              AVERTISSEMENT : Les prédictions sont fournies à titre informatif par un moteur d'IA. Le jeu comporte des risques. 
              Ne misez jamais plus que ce que vous pouvez vous permettre de perdre. 18+
            </p>
        </footer>
    </div>
  );
};

export default App;
