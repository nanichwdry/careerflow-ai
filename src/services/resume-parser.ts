import type { ParsedResume } from '@/types';
import { seedMasterResume } from '@/data/seed';

// Mock resume parser — swap with real PDF/DOCX parsing service
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function parseResumeFile(_file: File): Promise<ParsedResume> {
  await delay(2000); // Simulate parsing time
  // In production, this would use a real parser (e.g., pdf-parse, mammoth, or external API)
  // For MVP, return realistic seed data
  return { ...seedMasterResume.parsedData };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
