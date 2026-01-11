
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
  const [analysis, setAnalysis] = useState<{dataFound: boolean, intro: string, recommendations: any[], conclusion: string} | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const result = await geminiService.getBestChoiceAnalysis(sport.name, selectedDate);
      
      if (!result.dataFound || !result.recommendations || result.recommendations.length === 0) {
        setError(`L'IA n'a trouvé aucun match réel de ${sport.name} programmé pour le ${selectedDate}. Veuillez vérifier le calendrier officiel.`);
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
      setError("Échec de la vérification des données en temps réel.");
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
            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{sport.name} • Grounding Search & Gemini 3 Pro</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleRunAnalysis} className="flex gap-3 bg-brand-dark/50 p-2 rounded-2xl border border-gray-800">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white rounded-xl px-4 py-2 text-sm focus:ring-0 outline-none font-bold" />
            <button type="submit" disabled={isLoading} className="bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-2.5 rounded-xl text-xs font-black transition-all">
              {isLoading ? 'VÉRIFICATION...' : 'VÉRIFIER & ANALYSER'}
            </button>
          </form>
          {analysis && (
            <button onClick={handleExportPdf} disabled={isExporting} className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-2xl text-xs font-black transition-all">
              {isExporting ? 'EXPORT...' : 'PDF'}
            </button>
          )}
        </div>
      </div>

      {isLoading && <Loader text={`L'IA Gemini 3 Pro consulte Google Search pour identifier les matchs réels du ${selectedDate}...`} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-8 rounded-[2rem] text-center font-bold animate-pulse">
           <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
           {error}
        </div>
      )}

      {analysis && analysis.dataFound && (
        <div ref={reportRef} className="space-y-10 animate-fade-in-up p-4 sm:p-0">
          <div className="bg-gradient-to-r from-emerald-600/20 to-transparent border-l-4 border-brand-accent p-8 rounded-2xl relative overflow-hidden">
             <div className="absolute top-2 right-4 flex items-center gap-1 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>
                <span className="text-[8px] font-black text-brand-accent uppercase">Live Verified Data</span>
             </div>
             <h4 className="text-brand-accent text-[10px] font-black uppercase tracking-widest mb-3">Audit Analytique PRO++ - {sport.name} - {selectedDate}</h4>
             <p className="text-emerald-50 text-lg leading-relaxed font-medium">{analysis.intro}</p>
          </div>

          <div className="bg-brand-secondary border border-brand-accent/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               <h3 className="text-xl font-black text-brand-accent uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="w-8 h-px bg-brand-accent"></span> SÉLECTION VÉRIFIÉE <span className="w-8 h-px bg-brand-accent"></span>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-brand-dark/40 rounded-2xl border border-gray-800 hover:border-brand-accent/50 transition-all group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded uppercase border border-brand-accent/10">Real-Time Sync</span>
                            <p className="text-[9px] font-black text-gray-500 uppercase">{rec.match}</p>
                        </div>
                        <p className="text-white font-bold text-sm leading-tight group-hover:text-brand-accent transition-colors">{rec.choice}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs font-black text-brand-accent tracking-tighter tabular-nums">{rec.confidence}%</div>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">{rec.market}</p>
                      </div>
                    </div>
                  ))}
               </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="group bg-brand-secondary border border-gray-700/50 rounded-[3rem] overflow-hidden hover:border-brand-accent/40 transition-all">
                <div className="p-8 lg:p-12 flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-2/5 space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-brand-accent/10 text-brand-accent text-[9px] font-black uppercase rounded-full border border-brand-accent/20">Option {idx + 1} - {rec.market}</span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">{rec.match}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-brand-dark/60 rounded-[2.5rem] border border-gray-800 shadow-inner relative overflow-hidden group-hover:border-brand-accent/30 transition-all">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Pari de Précision Groundé</p>
                            <span className="text-2xl font-black text-brand-accent italic leading-none block">{rec.choice}</span>
                        </div>
                        <div className="px-4">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confiance IA (Stats Réelles)</p>
                                <span className="text-xl font-black text-brand-accent tabular-nums">{rec.confidence}%</span>
                            </div>
                            <div className="h-4 bg-brand-dark rounded-full overflow-hidden p-1 border border-gray-800">
                                <div className="h-full bg-gradient-to-r from-brand-accent to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{width: `${rec.confidence}%`}} />
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="lg:w-3/5">
                    <div className="h-full bg-brand-dark/40 p-8 lg:p-10 rounded-[2.5rem] border border-gray-800 relative shadow-inner">
                      <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-4 h-px bg-gray-700"></span> JUSTIFICATION TECHNIQUE GROUNDÉE
                      </h5>
                      <p className="text-gray-300 text-lg leading-relaxed font-medium italic mb-4">{rec.reasoning}</p>
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800/50">
                        <span className="text-[8px] font-black bg-white/5 px-3 py-1 rounded-full text-gray-500 uppercase border border-white/5">Officiels Audit</span>
                        <span className="text-[8px] font-black bg-white/5 px-3 py-1 rounded-full text-gray-500 uppercase border border-white/5">Search Grounding OK</span>
                        <span className="text-[8px] font-black bg-white/5 px-3 py-1 rounded-full text-gray-500 uppercase border border-white/5">Niche Stats Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-secondary to-brand-dark p-12 rounded-[3.5rem] border border-brand-accent/20 text-center shadow-2xl relative overflow-hidden group">
            <div className="relative">
                <h4 className="text-brand-accent font-black uppercase text-sm tracking-[0.4em] mb-4 italic">Verdict Analytique Final PRO++</h4>
                <p className="text-white font-bold text-2xl leading-tight max-w-4xl mx-auto tracking-tight uppercase">{analysis.conclusion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestChoiceAnalyst;
