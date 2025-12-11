import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
const pdf = require('pdf-parse');

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  text?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({});

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(file.filepath);

    const data = await pdf(dataBuffer);

    fs.unlinkSync(file.filepath);

    if (!data.text || data.text.trim().length === 0) {
      return res.status(400).json({ error: 'No text found in PDF' });
    }

    return res.status(200).json({ text: data.text });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to extract text from PDF'
    });
  }
}
