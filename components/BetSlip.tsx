
import React, { useRef, useState } from 'react';
import { BetSlip as BetSlipType } from '../types';

interface BetSlipProps {
  slip: BetSlipType;
}

const BetSlip: React.FC<BetSlipProps> = ({ slip }) => {
  const [isExporting, setIsExporting] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!slipRef.current) return;
    setIsExporting(true);
    try {
      const element = slipRef.current;
      const canvas = await (window as any).html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#1F2937',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      pdf.save(`Ticket_${(slip.title || 'IA').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const hasBets = slip.bets && Array.isArray(slip.bets) && slip.bets.length > 0;
  // Nettoyage sommaire pour éviter les textes d'IA trop longs dans le titre
  const displayTitle = (slip.title && slip.title.length < 50) ? slip.title : "SÉLECTION IA EXPERT";

  return (
    <div className="relative group w-full">
      <div ref={slipRef} className="bg-brand-secondary border border-gray-700 rounded-xl overflow-hidden shadow-2xl w-full flex flex-col min-h-[250px] transition-all hover:border-brand-accent/30">
        <div className="p-5 bg-gray-800/80 flex justify-between items-start border-b border-gray-700">
          <div className="flex-1 mr-4">
            <h3 className="font-black text-lg text-brand-accent uppercase tracking-tighter leading-tight mb-2">
              {displayTitle}
            </h3>
            {slip.analysis && (
              <div className="bg-brand-dark/30 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-300 italic leading-snug font-medium">
                  {slip.analysis.length > 250 ? slip.analysis.substring(0, 250) + '...' : slip.analysis}
                </p>
              </div>
            )}
          </div>
          <div className="h-10 w-10 bg-brand-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-brand-accent/20 shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
             </svg>
          </div>
        </div>
        
        <div className="p-5 flex flex-col gap-4 flex-grow">
          {hasBets ? (
            slip.bets.map((bet, index) => (
              <div key={index} className="bg-brand-dark/60 p-4 rounded-xl border-l-4 border-brand-accent shadow-inner animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex justify-between items-start mb-1">
                   <p className="font-black text-[10px] text-brand-accent uppercase tracking-widest">{bet.event || "Événement"}</p>
                   <span className="text-[8px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full border border-white/5">Verified</span>
                </div>
                <p className="text-white font-black text-sm mb-1 uppercase tracking-tight">
                  <span className="text-gray-400 font-bold">{bet.market || "Pari"} :</span> {bet.prediction || "N/A"}
                </p>
                {bet.justification && (
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed opacity-80 border-t border-white/5 pt-2 italic">
                    {bet.justification}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-brand-dark/20 rounded-xl border border-dashed border-gray-700">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Recherche de données réelles...</p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-[200px]">Si aucun match n'est trouvé pour aujourd'hui, l'IA scanne les jours suivants.</p>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-brand-dark/50 text-center border-t border-gray-800">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">AI AUDIT CERTIFIED • GROUNDED SEARCH</span>
        </div>
      </div>
      
      {hasBets && (
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all bg-brand-accent hover:bg-brand-accent-hover text-white p-3 rounded-xl shadow-2xl scale-90 group-hover:scale-100"
          title="Exporter en PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default BetSlip;
