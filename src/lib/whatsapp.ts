import { downloadPdfBlob } from './pdfGenerator';

export async function sendInvoiceViaWhatsApp(options: {
  pdfBlob: Blob;
  filename: string;
  invoiceNo: string;
  shopName: string;
  totalFormatted: string;
  partyPhone?: string;
  onFallbackHint?: (message: string) => void;
}) {
  const { pdfBlob, filename, invoiceNo, shopName, totalFormatted, partyPhone, onFallbackHint } = options;

  const textMessage = `Invoice No. ${invoiceNo} from ${shopName}, Total ${totalFormatted}`;
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Try Web Share API with PDF file
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: `Invoice ${invoiceNo}`,
        text: textMessage,
        files: [file]
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User cancelled share sheet
      console.warn('Web Share failed, falling back to wa.me:', err);
    }
  }

  // Fallback: Download PDF & open wa.me link
  downloadPdfBlob(pdfBlob, filename);

  let cleanPhone = (partyPhone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const encodedText = encodeURIComponent(`${textMessage}\n\n(Please attach the downloaded PDF file: ${filename})`);
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  if (onFallbackHint) {
    onFallbackHint(`PDF downloaded as "${filename}". Opening WhatsApp to send message...`);
  }

  window.open(whatsappUrl, '_blank');
}
