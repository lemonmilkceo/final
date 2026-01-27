/**
 * PDF 생성 유틸리티
 * html2pdf.js를 사용하여 HTML 요소를 PDF로 변환
 */

interface GeneratePDFOptions {
  filename?: string;
}

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 * @param element - PDF로 변환할 HTML 요소
 * @param options - PDF 생성 옵션
 */
export async function generatePDF(
  element: HTMLElement,
  options: GeneratePDFOptions = {}
): Promise<void> {
  // html2pdf.js는 클라이언트에서만 동작
  if (typeof window === 'undefined') {
    throw new Error('PDF 생성은 브라우저에서만 가능합니다');
  }

  // 동적 import (클라이언트 사이드에서만 로드)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import('html2pdf.js') as any).default;

  const pdfOptions = {
    margin: 0,
    filename: options.filename || '근로계약서.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
  };

  await html2pdf()
    .set(pdfOptions)
    .from(element)
    .save();
}

/**
 * 계약서 PDF 파일명 생성
 * @param workerName - 근로자 이름
 * @param date - 계약서 작성일 (기본: 오늘)
 */
export function getContractPDFFilename(
  workerName: string,
  date?: Date
): string {
  const d = date || new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `근로계약서_${workerName}_${dateStr}.pdf`;
}
