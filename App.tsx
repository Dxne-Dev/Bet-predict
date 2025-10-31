
import React, { useState } from 'react';
import SingleEventAnalysis from './components/SingleEventAnalysis';
import TicketBuilder from './components/TicketBuilder';
import MegaBets from './components/MegaBets';

type Tab = 'single' | 'builder' | 'mega';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('single');

  const renderContent = () => {
    switch (activeTab) {
      case 'single':
        return <SingleEventAnalysis />;
      case 'builder':
        return <TicketBuilder />;
      case 'mega':
        return <MegaBets />;
      default:
        return null;
    }
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
    <div className="min-h-screen bg-brand-dark font-sans">
      <header className="bg-brand-secondary/50 shadow-lg p-4">
        <div className="container mx-auto text-center">
            <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L10 11.586l3.293-3.293a1 1 0 011.414 0L17.586 11H14a1 1 0 110-2h-2z" clipRule="evenodd" />
                    <path d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 10-2 0v6H5V5h6a1 1 0 100-2H3z" />
                </svg>
                <h1 className="text-3xl font-bold text-brand-light">
                    Pronostics Sportifs <span className="text-brand-accent">IA</span>
                </h1>
            </div>
          <p className="text-gray-400 mt-1">Votre assistant intelligent pour des paris éclairés</p>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex justify-center space-x-2 md:space-x-8" aria-label="Tabs">
            <TabButton tabId="single" currentTab={activeTab} onClick={setActiveTab}>Analyse d'Événement</TabButton>
            <TabButton tabId="builder" currentTab={activeTab} onClick={setActiveTab}>Build Ticket</TabButton>
            <TabButton tabId="mega" currentTab={activeTab} onClick={setActiveTab}>Méga-Paris</TabButton>
          </nav>
        </div>
        
        <div>{renderContent()}</div>
      </main>

       <footer className="text-center p-4 mt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Pronostics Sportifs IA. Tous droits réservés.</p>
            <p className="text-xs text-gray-600 mt-1">Jeu responsable. Les prédictions sont générées par IA et ne garantissent aucun résultat.</p>
        </footer>
    </div>
  );
};

export default App;
