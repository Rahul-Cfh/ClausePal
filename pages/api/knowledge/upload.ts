import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as typeof import('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx') as typeof import('xlsx');

export const config = {
  api: { bodyParser: false },
};

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type DocSummary = {
  overview: string;
  keyPositions: string[];
  nonNegotiables: string[];
  favorableTerms: string[];
  watchPoints: string[];
};

type ResponseData = {
  document?: Record<string, unknown>;
  error?: string;
};

async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (filename.endsWith('.txt') || filename.endsWith('.csv') || mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  if (filename.endsWith('.xlsx') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames.map((name: string) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      return `Sheet: ${name}\n${csv}`;
    }).join('\n\n');
  }

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text.trim();
}

async function summariseWithClaude(text: string, documentType: string): Promise<DocSummary> {
  const trimmed = text.slice(0, 12000);
  const typeLabel: Record<string, string> = {
    playbook: 'legal playbook / negotiation guide',
    past_contract: 'previously signed contract',
    template: 'contract template',
    policy: 'company policy document',
  };

  const prompt = `You are a legal analyst extracting structured knowledge from a ${typeLabel[documentType] ?? documentType}.

DOCUMENT TEXT:
"""
${trimmed}
"""

Extract the key legal knowledge from this document and return ONLY valid JSON with this exact structure:
{
  "overview": "2-3 sentence plain-English summary of what this document covers and its purpose",
  "keyPositions": ["array of strings — the key legal positions, stances, or standards defined in this document"],
  "nonNegotiables": ["array of strings — terms or positions that are explicitly non-negotiable or must always be included"],
  "favorableTerms": ["array of strings — terms that are particularly favorable or protective"],
  "watchPoints": ["array of strings — things to watch for or be careful about when using this document"]
}

Rules:
- Each array should have 3-7 items
- Keep each item concise (1-2 sentences max)
- Focus on actionable legal positions, not document metadata
- If a category doesn't apply to this document type, return an empty array []
- Return ONLY the JSON object, no markdown, no commentary`;

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = result.content[0];
  let raw = (block.type === 'text' ? block.text : '').trim();
  if (raw.startsWith('```json')) raw = raw.slice(7);
  else if (raw.startsWith('```')) raw = raw.slice(3);
  if (raw.endsWith('```')) raw = raw.slice(0, -3);

  return JSON.parse(raw.trim()) as DocSummary;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let tempPath: string | null = null;

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    const documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType ?? 'playbook';
    const accessToken = Array.isArray(fields.accessToken) ? fields.accessToken[0] : fields.accessToken;

    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!accessToken) return res.status(401).json({ error: 'Authentication required.' });

    const filename = file.originalFilename ?? 'document';
    const mimeType = file.mimetype ?? '';

    const isSupported =
      filename.endsWith('.pdf')  || mimeType === 'application/pdf' ||
      filename.endsWith('.txt')  || filename.endsWith('.csv') ||
      filename.endsWith('.xlsx') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType.startsWith('text/');
    if (!isSupported) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: 'Supported formats: PDF, TXT, CSV, XLSX.' });
    }

    tempPath = file.filepath;
    const buffer = fs.readFileSync(tempPath);
    fs.unlinkSync(tempPath);
    tempPath = null;

    // Extract text
    let rawText: string;
    try {
      rawText = await extractText(buffer, mimeType, filename);
    } catch {
      return res.status(400).json({ error: 'Could not extract text from this file. Check that it is not scanned or encrypted.' });
    }

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: 'Too little text could be extracted from this file.' });
    }

    // Summarise with Claude
    let summary: DocSummary;
    try {
      summary = await summariseWithClaude(rawText, documentType);
    } catch {
      return res.status(500).json({ error: 'Failed to analyse document with AI.' });
    }

    // Save to Supabase using the user's token (respects RLS)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return res.status(401).json({ error: 'Invalid session.' });

    const { data, error: insertError } = await supabaseUser
      .from('knowledge_documents')
      .insert({
        user_id: user.id,
        file_name: filename,
        document_type: documentType,
        raw_text: rawText.slice(0, 50000),
        summary,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ document: data });
  } catch (err) {
    if (tempPath) try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Knowledge Upload]', msg);
    return res.status(500).json({ error: msg });
  }
}
