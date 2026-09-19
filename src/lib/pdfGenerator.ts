import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateInvoicePDF(element: HTMLElement, filename: string): Promise<Blob> {
  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  // Force fixed desktop render width (800px) so mobile viewport limits do NOT clip the canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 800,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      // Sanitize style tags so html2canvas doesn't crash or turn backgrounds black
      const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
      styleTags.forEach((tag) => {
        if (tag.textContent && tag.textContent.includes('oklch')) {
          let css = tag.textContent;
          // Smart color property replacements
          css = css.replace(/background(-color)?\s*:\s*oklch\([^)]+\)/gi, 'background-color: #f3f4f6');
          css = css.replace(/border(-color)?\s*:\s*oklch\([^)]+\)/gi, 'border-color: #000000');
          css = css.replace(/color\s*:\s*oklch\([^)]+\)/gi, 'color: #000000');
          css = css.replace(/oklch\([^)]+\)/gi, '#000000');
          tag.textContent = css;
        }
      });
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
