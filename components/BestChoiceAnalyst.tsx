
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
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
        setError(`L'Agent n'a pas pu isoler de choix à haute confiance.`);
      } else {
        setAnalysis(result);
        databaseService.saveEntry({
          sport: sport.name,
          mode: 'proPlus',
          type: 'best_choice',
          label: `Analyste Décisionnel ${sport.name} (${selectedDate})`,
          data: result
        });
      }
    } catch (err) {
      setError("Échec de l'agent décisionnel.");
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
      console.error("Erreur PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-brand-secondary/80 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-brand-dark rounded-2xl hover:bg-brand-accent transition-all group shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-ping"></span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Analyste <span className="text-brand-accent">Décisionnel</span></h2>
            </div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{sport.name} • {isFootball ? 'Stats Granulaires (Corners/Cartons)' : 'Données de Performance'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleRunAnalysis} className="flex gap-3 bg-brand-dark/50 p-2 rounded-2xl border border-gray-800">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white rounded-xl px-4 py-2 text-sm focus:ring-0 outline-none font-bold" />
            <button type="submit" disabled={isLoading} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-2.5 rounded-xl text-xs font-black transition-all">
              {isLoading ? 'SCAN...' : 'SCANNER'}
            </button>
          </form>
          {analysis && (
            <button onClick={handleExportPdf} disabled={isExporting} className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl text-xs font-black transition-all">
              {isExporting ? 'EXPORT...' : 'PDF'}
            </button>
          )}
        </div>
      </div>

      {isLoading && <Loader text={`L'Agent IA PRO++ analyse les corners, l'arbitrage et les tendances granulaires...`} />}

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-8 rounded-[2rem] text-center font-bold">{error}</div>}

      {analysis && (
        <div ref={reportRef} className="space-y-10 animate-fade-in-up p-4 sm:p-0">
          <div className="bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 p-8 rounded-2xl relative overflow-hidden">
             <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">Rapport Analytique Global PRO++ - {selectedDate}</h4>
             <p className="text-blue-100 text-lg leading-relaxed font-medium">{analysis.intro}</p>
          </div>

          {/* Synthèse Spécifique Football */}
          {isFootball && (
            <div className="bg-brand-secondary border border-brand-accent/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <svg className="w-24 h-24 text-brand-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
               </div>
               <h3 className="text-xl font-black text-brand-accent uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="w-8 h-px bg-brand-accent"></span> Synthèse du Combiné <span className="w-8 h-px bg-brand-accent"></span>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-brand-dark/40 rounded-2xl border border-gray-800">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase">{rec.match}</p>
                        <p className="text-white font-bold text-sm">{rec.market}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-brand-accent font-black text-lg italic">{rec.choice}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="group bg-brand-secondary border border-gray-700/50 rounded-[3rem] overflow-hidden hover:border-brand-accent/40 transition-all">
                <div className="p-8 lg:p-12 flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/5 space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-brand-accent/10 text-brand-accent text-[9px] font-black uppercase rounded-full border border-brand-accent/20">Option {idx + 1}</span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight uppercase">{rec.match}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-brand-dark/60 rounded-[2rem] border border-gray-800 shadow-inner">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{rec.market}</p>
                            <span className="text-2xl font-black text-brand-accent italic leading-none">{rec.choice}</span>
                        </div>
                        <div className="px-2">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confiance IA PRO++</p>
                                <span className="text-xl font-black text-brand-accent">{rec.confidence}%</span>
                            </div>
                            <div className="h-3 bg-brand-dark rounded-full overflow-hidden p-0.5 border border-gray-800">
                                <div className="h-full bg-gradient-to-r from-brand-accent to-emerald-400 rounded-full transition-all duration-1000" style={{width: `${rec.confidence}%`}} />
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="lg:w-3/5">
                    <div className="h-full bg-brand-dark/40 p-8 lg:p-10 rounded-[2.5rem] border border-gray-800 relative">
                      <div className="absolute top-6 right-8 opacity-20">
                         <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </div>
                      <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Justification Granulaire</h5>
                      <p className="text-gray-300 text-lg leading-relaxed font-medium italic">{rec.reasoning}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-secondary to-brand-dark p-10 rounded-[3rem] border border-brand-accent/20 text-center shadow-2xl relative">
            <div className="absolute inset-0 bg-brand-accent/5 blur-3xl rounded-full"></div>
            <h4 className="relative text-brand-accent font-black uppercase text-sm tracking-[0.3em] mb-4">Verdict Final PRO++</h4>
            <p className="relative text-white font-semibold text-xl leading-relaxed max-w-3xl mx-auto">{analysis.conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestChoiceAnalyst;
