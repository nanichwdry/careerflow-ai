import type { Job } from '@/types/jobs';

const APP_ID = import.meta.env.VITE_ADZUNA_APP_ID || 'bf8edb79';
const APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY || 'd0c4b583032b3dede143df6f916e2c82';
const BASE_URL = '/adzuna-api/v1/api/jobs';

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  category: { label: string; tag: string };
  latitude?: number;
  longitude?: number;
}

interface AdzunaResponse {
  results: AdzunaResult[];
  count: number;
}

function mapToJob(r: AdzunaResult): Job {
  const empType = r.contract_time === 'part_time' ? 'part-time'
    : r.contract_type === 'contract' ? 'contract'
    : 'full-time';

  const locLower = (r.location?.display_name || '').toLowerCase();
  const titleLower = r.title.toLowerCase();
  const workArrangement = locLower.includes('remote') || titleLower.includes('remote') ? 'remote'
    : locLower.includes('hybrid') || titleLower.includes('hybrid') ? 'hybrid'
    : 'onsite';

  const expLevel = titleLower.includes('senior') || titleLower.includes('sr.') ? 'senior'
    : titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('staff') ? 'lead'
    : titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('intern') ? 'entry'
    : titleLower.includes('executive') || titleLower.includes('director') || titleLower.includes('vp') ? 'executive'
    : 'mid';

  return {
    id: crypto.randomUUID(),
    sourceId: 'adzuna',
    sourceJobId: r.id,
    sourceUrl: r.redirect_url,
    title: r.title,
    company: r.company?.display_name || 'Unknown',
    location: r.location?.display_name || 'Not specified',
    workArrangement,
    salary: (r.salary_min || r.salary_max) ? {
      min: r.salary_min ? Math.round(r.salary_min) : undefined,
      max: r.salary_max ? Math.round(r.salary_max) : undefined,
      currency: 'USD',
      period: 'yearly',
    } : undefined,
    postedDate: r.created,
    employmentType: empType as Job['employmentType'],
    experienceLevel: expLevel as Job['experienceLevel'],
    description: r.description,
    applyMethod: 'external',
    easyApply: false,
    industry: r.category?.label || undefined,
    skills: [],
    fetchedAt: new Date().toISOString(),
  };
}

export async function searchAdzunaJobs(
  query: string,
  opts: { location?: string; remoteOnly?: boolean; salaryMin?: number; page?: number } = {},
): Promise<{ jobs: Job[]; total: number }> {
  if (!APP_ID || APP_ID.startsWith('<') || !APP_KEY || APP_KEY.startsWith('<')) {
    throw new Error(
      'Adzuna API credentials are not configured. Add VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY to your .env file, then restart the dev server.',
    );
  }
  const country = 'us';
  const page = opts.page || 1;
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: '20',
    what: query,
  });

  if (opts.location) params.set('where', opts.location);
  if (opts.salaryMin) params.set('salary_min', String(opts.salaryMin));

  const url = `${BASE_URL}/${country}/search/${page}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Adzuna API error ${res.status}: ${text}`);
  }

  const data: AdzunaResponse = await res.json();
  let jobs = data.results.map(mapToJob);

  if (opts.remoteOnly) {
    jobs = jobs.filter(j => j.workArrangement === 'remote');
  }

  return { jobs, total: data.count };
}
