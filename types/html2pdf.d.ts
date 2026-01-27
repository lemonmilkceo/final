declare module 'html2pdf.js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      logging?: boolean;
    };
    jsPDF?: {
      unit?: string;
      format?: string | number[];
      orientation?: string;
    };
    pagebreak?: { mode?: string[] };
  }

  interface Html2Pdf {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set(options: any): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
    output(type: string): Promise<string>;
    outputPdf(type: string): Promise<Blob>;
  }

  function html2pdf(): Html2Pdf;
  export default html2pdf;
}
