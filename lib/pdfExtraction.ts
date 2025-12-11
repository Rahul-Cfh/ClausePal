import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export type PDFExtractionError = {
  type: 'no_text' | 'encrypted' | 'corrupted' | 'unsupported' | 'server_error';
  message: string;
  details?: string;
};

export async function extractTextFromPDFClient(file: File): Promise<string> {
  try {
    console.log('[Client PDF] Starting client-side extraction...');

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[Client PDF] File loaded into array buffer:', uint8Array.length, 'bytes');

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    console.log(`[Client PDF] Document loaded. Pages: ${numPages}`);

    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');

        fullText += pageText + '\n';

        console.log(`[Client PDF] Page ${pageNum}/${numPages} extracted: ${pageText.length} chars`);
      } catch (pageError) {
        console.error(`[Client PDF] Error on page ${pageNum}:`, pageError);
      }
    }

    console.log(`[Client PDF] Total extracted: ${fullText.trim().length} chars`);

    return fullText.trim();
  } catch (error) {
    console.error('[Client PDF] Extraction error:', error);
    throw error;
  }
}

export async function extractTextFromPDFServer(file: File): Promise<string> {
  console.log('[Server PDF] Starting server-side extraction...');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/extract-pdf-text', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: PDFExtractionError = {
      type: data.errorType || 'server_error',
      message: data.error || 'Failed to extract text from PDF',
      details: data.details,
    };
    throw error;
  }

  console.log(`[Server PDF] Extracted ${data.text?.length || 0} chars`);

  return data.text;
}

export async function extractTextFromPDFWithFallback(file: File): Promise<string> {
  let clientError: Error | null = null;
  let serverError: PDFExtractionError | null = null;

  try {
    const text = await extractTextFromPDFClient(file);
    if (text && text.trim().length > 0) {
      console.log('[PDF] Client-side extraction successful');
      return text;
    }
  } catch (error) {
    console.warn('[PDF] Client-side extraction failed, trying server-side...', error);
    clientError = error instanceof Error ? error : new Error(String(error));
  }

  try {
    const text = await extractTextFromPDFServer(file);
    if (text && text.trim().length > 0) {
      console.log('[PDF] Server-side extraction successful');
      return text;
    }
  } catch (error) {
    console.error('[PDF] Server-side extraction also failed', error);
    serverError = error as PDFExtractionError;
  }

  if (serverError) {
    throw new Error(serverError.message);
  }

  if (clientError) {
    if (clientError.message?.includes('password') || clientError.message?.includes('encrypted')) {
      throw new Error('This PDF is password-protected. Please provide an unlocked version.');
    }

    if (clientError.message?.includes('Invalid PDF')) {
      throw new Error('Invalid or corrupted PDF file. Please check the file and try again.');
    }

    throw new Error('Failed to extract text from PDF: ' + clientError.message);
  }

  throw new Error('No text could be extracted from this PDF. It may be image-based or scanned.');
}
