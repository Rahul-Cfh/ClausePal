import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  text?: string;
  error?: string;
  errorType?: 'no_text' | 'encrypted' | 'corrupted' | 'unsupported' | 'server_error';
  details?: string;
};

async function extractTextWithPdfParse(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Extraction] Starting pdf-parse extraction...');

    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const text = textResult.text;

    console.log(`[PDF Extraction] Document loaded successfully. Pages: ${textResult.pages.length}`);
    console.log(`[PDF Extraction] Text extracted: ${text.length} chars`);

    return text.trim();
  } catch (error) {
    console.error('[PDF Extraction] pdf-parse error:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  let uploadedFilePath: string | null = null;

  try {
    console.log('[PDF Extraction] Starting extraction process...');

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];

    if (!file) {
      console.error('[PDF Extraction] No file in request');
      return res.status(400).json({
        error: 'No file uploaded',
        errorType: 'server_error'
      });
    }

    uploadedFilePath = file.filepath;

    console.log(`[PDF Extraction] File received: ${file.originalFilename}, Size: ${file.size} bytes`);

    if (file.size === 0) {
      return res.status(400).json({
        error: 'Uploaded file is empty',
        errorType: 'corrupted'
      });
    }

    const dataBuffer = fs.readFileSync(file.filepath);
    console.log(`[PDF Extraction] File read into buffer: ${dataBuffer.length} bytes`);

    let extractedText = '';

    try {
      extractedText = await extractTextWithPdfParse(dataBuffer);
      console.log(`[PDF Extraction] Text extracted: ${extractedText.length} chars`);
    } catch (extractError: any) {
      console.error('[PDF Extraction] Extraction failed:', extractError);

      if (extractError.message?.includes('password') || extractError.message?.includes('encrypted')) {
        fs.unlinkSync(file.filepath);
        return res.status(400).json({
          error: 'This PDF is password-protected or encrypted. Please provide an unlocked version.',
          errorType: 'encrypted',
          details: extractError.message
        });
      }

      if (extractError.message?.includes('Invalid PDF')) {
        fs.unlinkSync(file.filepath);
        return res.status(400).json({
          error: 'Invalid or corrupted PDF file. Please check the file and try again.',
          errorType: 'corrupted',
          details: extractError.message
        });
      }

      throw extractError;
    }

    fs.unlinkSync(file.filepath);
    uploadedFilePath = null;

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn('[PDF Extraction] No text found in PDF');
      return res.status(400).json({
        error: 'No text could be extracted from this PDF. It may be image-based or scanned. Please use a text-based PDF or convert it using OCR.',
        errorType: 'no_text',
        details: 'The PDF appears to contain no extractable text content'
      });
    }

    const extractionTime = Date.now() - startTime;
    console.log(`[PDF Extraction] Success! Extracted ${extractedText.length} characters in ${extractionTime}ms`);

    return res.status(200).json({ text: extractedText });

  } catch (error) {
    if (uploadedFilePath) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupError) {
        console.error('[PDF Extraction] Cleanup error:', cleanupError);
      }
    }

    console.error('[PDF Extraction] Unhandled error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return res.status(500).json({
      error: 'Failed to process PDF. Please try again or use a different file.',
      errorType: 'server_error',
      details: errorMessage
    });
  }
}
