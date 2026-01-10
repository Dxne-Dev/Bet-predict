
import React, { useState, useEffect } from 'react';
import SingleEventAnalysis from './components/SingleEventAnalysis';
import TicketBuilder from './components/TicketBuilder';
import MegaBets from './components/MegaBets';
import FirstHalfTime from './components/FirstHalfTime';
import GoalscorerAnalysis from './components/GoalscorerAnalysis';
import NbaDigitAnalysis from './components/NbaDigitAnalysis';
import ProPlusSelector from './components/ProPlusSelector';
import BestChoiceAnalyst from './components/BestChoiceAnalyst';
import PredictionHistory from './components/PredictionHistory';
import { Sport, AppMode } from './types';
import { sportsDataService } from './services/sportsDataService';

type Tab = 'single' | 'builder' | 'mega' | 'firstHalf' | 'goalscorer' | 'nbaDigit' | 'history' | 'proPlusAnalyst';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const [mode, setMode] = useState<AppMode>('pro');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    sportsDataService.getSports().then(setSports);
  }, []);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'proPlus') {
      setActiveTab('proPlusAnalyst');
    } else {
      setActiveTab('single');
    }
  };

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
      case 'history':
        return <PredictionHistory mode="pro" />;
      default:
        return null;
    }
  };

  const renderProPlusContent = () => {
    if (activeTab === 'history') {
      return <PredictionHistory mode="proPlus" />;
    }

    if (!selectedSport) {
      return (
        <ProPlusSelector 
          sports={sports} 
          onSelect={(sport) => setSelectedSport(sport)} 
        />
      );
    }

    return (
      <BestChoiceAnalyst 
        sport={selectedSport} 
        onBack={() => setSelectedSport(null)} 
      />
    );
  };
  
  const TabButton: React.FC<{tabId: Tab; currentTab: Tab; onClick: (tab: Tab) => void; children: React.ReactNode; isProPlus?: boolean}> = ({tabId, currentTab, onClick, children, isProPlus}) => {
      const isActive = tabId === currentTab;
      return (
        <button
            onClick={() => onClick(tabId)}
            className={`px-4 py-3 text-sm md:text-base font-black transition-all border-b-2 flex items-center gap-2 ${
            isActive
                ? isProPlus ? 'bg-gradient-to-t from-brand-accent/10 to-transparent text-brand-accent border-brand-accent' : 'bg-brand-secondary text-brand-accent border-brand-accent'
                : 'text-gray-500 hover:text-white border-transparent'
            }`}
        >
            {children}
        </button>
      )
  }

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-brand-light selection:bg-brand-accent/30">
      <header className="bg-brand-secondary/50 shadow-2xl p-4 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-brand-accent/20 p-2.5 rounded-2xl border border-brand-accent/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L10 11.586l3.293-3.293a1 1 0 011.414 0L17.586 11H14a1 1 0 110-2h-2z" clipRule="evenodd" />
                      <path d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 10-2 0v6H5V5h6a1 1 0 100-2H3z" />
                  </svg>
                </div>
                <div>
                    <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase leading-none italic">
                        PRONOSTICS <span className="text-brand-accent">IA</span>
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Plateforme d'Audit Expert</p>
                </div>
            </div>

            <div className="flex items-center bg-brand-dark/80 p-1.5 rounded-2xl border border-gray-800 shadow-inner">
                <button 
                    onClick={() => handleModeChange('pro')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${mode === 'pro' ? 'bg-brand-secondary text-brand-accent shadow-lg border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    MODE PRO
                </button>
                <div className="w-px h-4 bg-gray-800 mx-1"></div>
                <button 
                    onClick={() => handleModeChange('proPlus')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${mode === 'proPlus' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    MODE PRO++
                    <span className="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 min-h-[70vh]">
        {mode === 'pro' ? (
            <>
                <div className="border-b border-gray-800 mb-10 overflow-x-auto scrollbar-hide">
                    <nav className="-mb-px flex space-x-2 md:space-x-8 min-w-max justify-center" aria-label="Tabs">
                        <TabButton tabId="single" currentTab={activeTab} onClick={setActiveTab}>ANALYSES</TabButton>
                        <TabButton tabId="builder" currentTab={activeTab} onClick={setActiveTab}>TICKETS</TabButton>
                        <TabButton tabId="mega" currentTab={activeTab} onClick={setActiveTab}>MÉGA-PARIS</TabButton>
                        <TabButton tabId="firstHalf" currentTab={activeTab} onClick={setActiveTab}>1ÈRE MT</TabButton>
                        <TabButton tabId="goalscorer" currentTab={activeTab} onClick={setActiveTab}>BUTEURS</TabButton>
                        <TabButton tabId="nbaDigit" currentTab={activeTab} onClick={setActiveTab}>NBA DIGIT</TabButton>
                        <TabButton tabId="history" currentTab={activeTab} onClick={setActiveTab}>
                          HISTORIQUE 
                          <span className="text-[10px] bg-brand-accent/10 px-2 py-0.5 rounded-full">PRO</span>
                        </TabButton>
                    </nav>
                </div>
                <div className="max-w-7xl mx-auto">{renderProContent()}</div>
            </>
        ) : (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-center border-b border-gray-800 mb-8">
                   <nav className="-mb-px flex space-x-8">
                      <TabButton tabId="proPlusAnalyst" currentTab={activeTab} onClick={setActiveTab} isProPlus>
                        ANALYSTE DÉCISIONNEL
                      </TabButton>
                      <TabButton tabId="history" currentTab={activeTab} onClick={setActiveTab} isProPlus>
                        HISTORIQUE PRO++
                      </TabButton>
                   </nav>
                </div>
                {renderProPlusContent()}
            </div>
        )}
      </main>

       <footer className="text-center p-12 mt-20 border-t border-gray-900 bg-brand-secondary/10">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} Plateforme Pronostics IA - Système de vérification Post-Match</p>
        </footer>
    </div>
  );
};

export default App;
