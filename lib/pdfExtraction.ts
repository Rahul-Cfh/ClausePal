import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export type PDFExtractionError = {
  type: 'no_text' | 'encrypted' | 'corrupted' | 'unsupported' | 'server_error';
  message: string;
  details?: string;
};

export async function extractTextFromPDFClient(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Client-side PDF extraction can only run in browser context');
  }

  try {
    console.log('[Client PDF] Starting client-side extraction...');

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[Client PDF] File loaded into array buffer:', uint8Array.length, 'bytes');

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
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
  } catch (error: any) {
    console.error('[Client PDF] Extraction error:', error);

    if (error?.message?.includes('password') || error?.message?.includes('encrypted')) {
      throw new Error('This PDF is password-protected or encrypted.');
    }

    if (error?.message?.includes('Invalid PDF')) {
      throw new Error('Invalid or corrupted PDF file.');
    }

    if (error?.name === 'InvalidPDFException') {
      throw new Error('Invalid PDF file format.');
    }

    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected.');
    }

    throw new Error(error?.message || 'Failed to extract text from PDF');
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
  let serverError: PDFExtractionError | null = null;
  let clientError: Error | null = null;

  try {
    const text = await extractTextFromPDFServer(file);
    if (text && text.trim().length > 0) {
      console.log('[PDF] Server-side extraction successful');
      return text;
    }
  } catch (error) {
    console.warn('[PDF] Server-side extraction failed, trying client-side...', error);
    serverError = error as PDFExtractionError;
  }

  if (typeof window === 'undefined') {
    console.error('[PDF] Running in server context, cannot use client-side extraction');
    if (serverError) {
      throw new Error(serverError.message);
    }
    throw new Error('Failed to extract text from PDF');
  }

  try {
    const text = await extractTextFromPDFClient(file);
    if (text && text.trim().length > 0) {
      console.log('[PDF] Client-side extraction successful');
      return text;
    }
  } catch (error) {
    console.error('[PDF] Client-side extraction also failed', error);
    clientError = error instanceof Error ? error : new Error(String(error));
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
