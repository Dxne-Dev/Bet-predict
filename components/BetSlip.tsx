
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
      pdf.save(`Ticket_${slip.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative group w-full">
      <div ref={slipRef} className="bg-brand-secondary border border-gray-700 rounded-xl overflow-hidden shadow-2xl w-full">
        <div className="p-4 bg-gray-800/50 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-brand-accent uppercase tracking-tighter">{slip.title}</h3>
            {slip.analysis && <p className="text-xs text-gray-400 mt-1 italic">{slip.analysis}</p>}
          </div>
          <div className="h-8 w-8 bg-brand-accent/10 rounded flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-accent" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
             </svg>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {slip.bets && Array.isArray(slip.bets) && slip.bets.map((bet, index) => (
            <div key={index} className="bg-brand-dark/50 p-3 rounded-lg border-l-4 border-brand-accent">
              <p className="font-black text-xs text-gray-500 uppercase tracking-widest mb-1">{bet.event}</p>
              <p className="text-brand-light font-bold text-sm">
                <span className="text-gray-400 font-normal">{bet.market}:</span> {bet.prediction}
              </p>
              {bet.justification && <p className="text-[10px] text-gray-500 mt-1 italic leading-tight">"{bet.justification}"</p>}
            </div>
          ))}
        </div>
        <div className="p-3 bg-brand-dark/30 text-center border-t border-gray-800">
           <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Pronostics IA Certifiés</span>
        </div>
      </div>
      
      {/* Action Button - Floating on Hover */}
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-accent hover:bg-brand-accent-hover text-white p-2 rounded-lg shadow-xl"
        title="Exporter en PDF"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    </div>
  );
};

export default BetSlip;
