import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ParsedResume } from '@/types';

// Tell pdf.js where the worker file is (Vite resolves this at build time)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(text);
  }

  return pageTexts.join('\n').replace(/\s+/g, ' ').trim();
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractPdfText(file);
  }
  // DOCX: strip XML tags from raw content as best-effort
  const raw = await file.text();
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const PARSE_SYSTEM_PROMPT = `You are a resume parser. Extract structured data ONLY from the text provided.

CRITICAL RULES:
- NEVER invent, generate, or guess any data. Only use information explicitly present in the text.
- If a field is not found in the text, return an empty string "" or empty array [].
- Do NOT use example names like "John Doe", placeholder emails, or fictional companies.
- If the text appears to be garbled, binary, or unreadable, return all empty values.

Return JSON with exactly these fields:
- "fullName": string (only if clearly a person's name is present)
- "contact": { "email": string, "phone": string, "location": string, "linkedIn": string, "website": string }
- "summary": string (only if a summary/objective section exists; otherwise "")
- "skills": string[] (ALL technical skills, tools, frameworks, languages found in the text)
- "experience": array of { "id": string (uuid), "company": string, "title": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "bullets": string[] }
- "education": array of { "id": string (uuid), "institution": string, "degree": string, "field": string, "graduationDate": string, "gpa": string }
- "certifications": array of { "id": string (uuid), "name": string, "issuer": string, "date": string }
- "projects": array of { "id": string (uuid), "name": string, "description": string, "technologies": string[], "url": string }

For IDs, use random UUID-format strings.`;

// Known placeholder values that indicate hallucinated output
const PLACEHOLDER_NAMES = ['john doe', 'jane doe', 'your name', 'full name', 'sample resume'];

/** Parse resume from raw pasted text (fallback when PDF extraction fails) */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  if (!text.trim() || text.length < 50) {
    throw new Error('Please paste more resume content (at least a few lines).');
  }
  return runOpenAIParse(text.slice(0, 15000));
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  const rawText = await extractTextFromFile(file);

  if (!rawText.trim() || rawText.length < 50) {
    throw new Error(
      'Could not extract text from this PDF. It may be a scanned/image-based PDF. ' +
      'Please try: File → Save As → PDF (text) in your editor, or save as .docx instead.',
    );
  }

  return runOpenAIParse(rawText.slice(0, 15000));
}

async function runOpenAIParse(text: string): Promise<ParsedResume> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const parsed = JSON.parse(res.choices[0].message.content || '{}');

  // Detect hallucinated placeholder data
  if (PLACEHOLDER_NAMES.includes((parsed.fullName || '').toLowerCase())) {
    throw new Error(
      'Could not read your PDF properly (likely a scanned/image-based file). ' +
      'Please use the "Paste Text" tab instead.',
    );
  }

  return {
    fullName: parsed.fullName || '',
    contact: {
      email: parsed.contact?.email || '',
      phone: parsed.contact?.phone || '',
      location: parsed.contact?.location || '',
      linkedIn: parsed.contact?.linkedIn,
      website: parsed.contact?.website,
    },
    summary: parsed.summary || '',
    skills: parsed.skills || [],
    experience: (parsed.experience || []).map((e: Record<string, unknown>) => ({
      id: (e.id as string) || crypto.randomUUID(),
      company: e.company || '',
      title: e.title || '',
      location: e.location || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      current: e.current || false,
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
    })),
    education: (parsed.education || []).map((e: Record<string, unknown>) => ({
      id: (e.id as string) || crypto.randomUUID(),
      institution: e.institution || '',
      degree: e.degree || '',
      field: e.field || '',
      graduationDate: e.graduationDate || '',
      gpa: e.gpa,
    })),
    certifications: (parsed.certifications || []).map((c: Record<string, unknown>) => ({
      id: (c.id as string) || crypto.randomUUID(),
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || '',
    })),
    projects: (parsed.projects || []).map((p: Record<string, unknown>) => ({
      id: (p.id as string) || crypto.randomUUID(),
      name: p.name || '',
      description: p.description || '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      url: p.url as string | undefined,
    })),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
