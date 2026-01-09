
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { Sport } from '../types';
import Loader from './Loader';

interface BestChoiceAnalystProps {
  sport: Sport;
  onBack: () => void;
}

const BestChoiceAnalyst: React.FC<BestChoiceAnalystProps> = ({ sport, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [analysis, setAnalysis] = useState<{intro: string, recommendations: any[], conclusion: string} | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const isFootball = sport.id === 'football';

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const result = await geminiService.getBestChoiceAnalysis(sport.name, selectedDate);
      if (!result.recommendations || result.recommendations.length === 0) {
        setError(`L'Agent n'a pas pu isoler de choix à haute confiance via l'analyse ${isFootball ? 'granulaire' : 'de performance'} pour cette date.`);
      } else {
        setAnalysis(result);
      }
    } catch (err) {
      setError("Échec de l'agent décisionnel. Vérifiez la disponibilité des données sportives.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111827',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Analyse_${sport.name}_${selectedDate}.pdf`);
    } catch (err) {
      console.error("Erreur lors de l'export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Analyst Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-brand-secondary/80 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-brand-dark rounded-2xl hover:bg-brand-accent transition-all group shadow-inner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-ping"></span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Analyste <span className="text-brand-accent">Décisionnel</span></h2>
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{sport.name} • {isFootball ? 'Combinés Complexes' : 'Performance Data'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleRunAnalysis} className="flex gap-3 bg-brand-dark/50 p-2 rounded-2xl border border-gray-800">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white rounded-xl px-4 py-2 text-sm focus:ring-0 outline-none font-bold"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-brand-accent/20"
            >
              {isLoading ? 'SCAN...' : 'SCANNER'}
            </button>
          </form>

          {analysis && (
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl text-xs font-black transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'EXPORT...' : 'PDF'}
            </button>
          )}
        </div>
      </div>

      {isLoading && <Loader text={`L'Agent analyse les ${isFootball ? 'corners, l\'arbitrage et les tendances' : 'statistiques avancées de performance'}...`} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-8 rounded-[2rem] text-center font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {analysis && (
        <div ref={reportRef} className="space-y-10 animate-fade-in-up p-4 sm:p-0">
          {/* Intelligence Intro */}
          <div className="bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 p-8 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="h-24 w-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
             </div>
             <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">Rapport Analytique Global - {selectedDate}</h4>
             <p className="text-blue-100 text-lg leading-relaxed font-medium">
               {analysis.intro}
             </p>
          </div>

          {/* Core Recommendations */}
          <div className="grid grid-cols-1 gap-8">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="group bg-brand-secondary border border-gray-700/50 rounded-[3rem] overflow-hidden hover:border-brand-accent/40 transition-all hover:shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                <div className="p-8 lg:p-12 flex flex-col lg:flex-row gap-12">
                  {/* Left Column: Result Details */}
                  <div className="lg:w-2/5 space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full uppercase">Top Recommendation</span>
                        <div className="h-px flex-grow bg-gray-800"></div>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight tracking-tighter uppercase">{rec.match}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="p-6 bg-brand-dark/60 rounded-[2rem] border border-gray-800 shadow-inner group-hover:border-brand-accent/20 transition-colors">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Marché Sélectionné</p>
                            <p className="text-xl font-black text-white mb-2">{rec.market}</p>
                            <div className="flex items-center gap-3">
                                <span className="text-brand-accent text-2xl">➔</span>
                                <span className="text-2xl font-black text-brand-accent italic">{rec.choice}</span>
                            </div>
                        </div>

                        <div className="px-2">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confiance IA Pondérée</p>
                                <span className="text-xl font-black text-brand-accent">{rec.confidence}%</span>
                            </div>
                            <div className="h-3 bg-brand-dark rounded-full overflow-hidden p-0.5 border border-gray-800">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-accent to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                                    style={{width: `${rec.confidence}%`}}
                                />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Right Column: Reasoning */}
                  <div className="lg:w-3/5">
                    <div className="h-full bg-brand-dark/40 p-8 lg:p-10 rounded-[2.5rem] border border-gray-800 relative group-hover:bg-brand-dark/60 transition-all">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-accent/20 rounded-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                           </svg>
                        </div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Analyse & Justification {isFootball ? 'Granulaire' : 'Performance'}</h5>
                      </div>
                      
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 text-lg leading-relaxed font-medium italic">
                          {rec.reasoning}
                        </p>
                      </div>

                      <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-brand-accent opacity-5 blur-[40px] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expert Verdict Final */}
          <div className="bg-gradient-to-br from-brand-secondary to-brand-dark p-10 rounded-[3rem] border border-brand-accent/20 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>
            <div className="mb-4 inline-block p-4 bg-brand-accent/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <h4 className="text-brand-accent font-black uppercase text-sm tracking-[0.3em] mb-4">Verdict Final de l'Agent Décisionnel</h4>
            <p className="text-white font-semibold text-xl leading-relaxed max-w-3xl mx-auto">
              {analysis.conclusion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestChoiceAnalyst;
