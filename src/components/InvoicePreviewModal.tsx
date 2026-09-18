import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { generateInvoiceHTML, getShopDetails } from '../lib/invoiceTemplate';

interface InvoicePreviewModalProps {
  invoice: any;
  shopProfile?: any;
  onClose: () => void;
}

export default function InvoicePreviewModal({ invoice, shopProfile, onClose }: InvoicePreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!invoice) return null;

  const htmlContent = generateInvoiceHTML(invoice, shopProfile);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      // Fallback
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-gray-900">
              Invoice Preview ({invoice.invoiceIdStr || invoice.id || 'INV'})
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black text-white">
              Traditional Indian Standard
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
            >
              <Printer size={16} />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Iframe Preview Container */}
        <div className="flex-1 bg-gray-200/50 p-4 sm:p-6 overflow-auto flex justify-center items-start">
          <div className="bg-white shadow-lg w-full max-w-[840px] rounded border border-gray-300 overflow-hidden">
            <iframe
              ref={iframeRef}
              title={`Invoice ${invoice.invoiceIdStr}`}
              srcDoc={htmlContent}
              className="w-full h-[780px] border-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
