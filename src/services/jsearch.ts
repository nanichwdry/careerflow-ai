import type { Job, JobSearchFilters } from '@/types/jobs';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const STORAGE_KEY = 'cf_rapidapi_key';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string;
  job_salary_period: string;
  job_apply_link: string;
  job_apply_is_direct: boolean;
  job_required_skills: string[] | null;
  job_required_experience: { required_experience_in_months: number | null } | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
  };
}

function mapEmploymentType(raw: string): Job['employmentType'] {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('part')) return 'part-time';
  if (lower.includes('contract') || lower.includes('temporary')) return 'contract';
  if (lower.includes('intern')) return 'internship';
  return 'full-time';
}

function mapExperienceLevel(months: number | null | undefined): Job['experienceLevel'] {
  if (!months) return 'mid';
  const years = months / 12;
  if (years <= 1) return 'entry';
  if (years <= 3) return 'mid';
  if (years <= 7) return 'senior';
  if (years <= 12) return 'lead';
  return 'executive';
}

function normalizeJob(raw: JSearchJob): Job {
  const location = [raw.job_city, raw.job_state, raw.job_country].filter(Boolean).join(', ');
  return {
    id: raw.job_id,
    sourceId: 'jsearch',
    sourceJobId: raw.job_id,
    sourceUrl: raw.job_apply_link || '',
    title: raw.job_title,
    company: raw.employer_name,
    companyLogo: raw.employer_logo || undefined,
    location,
    workArrangement: raw.job_is_remote ? 'remote' : 'onsite',
    salary: raw.job_min_salary ? {
      min: raw.job_min_salary,
      max: raw.job_max_salary || undefined,
      currency: raw.job_salary_currency || 'USD',
      period: (raw.job_salary_period || 'YEAR').toLowerCase().includes('year') ? 'yearly' : 'monthly',
    } : undefined,
    postedDate: raw.job_posted_at_datetime_utc || new Date().toISOString(),
    employmentType: mapEmploymentType(raw.job_employment_type),
    experienceLevel: mapExperienceLevel(raw.job_required_experience?.required_experience_in_months),
    description: raw.job_description || '',
    applyMethod: raw.job_apply_is_direct ? 'easy_apply' : 'external',
    easyApply: raw.job_apply_is_direct || false,
    skills: raw.job_required_skills || [],
    fetchedAt: new Date().toISOString(),
  };
}

function buildQuery(filters: JobSearchFilters): string {
  const parts: string[] = [];
  if (filters.keyword) parts.push(filters.keyword);
  if (filters.jobTitle) parts.push(filters.jobTitle);
  return parts.join(' ') || 'software engineer';
}

export async function searchJobs(filters: JobSearchFilters, page = 1): Promise<{ jobs: Job[]; total: number }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured. Go to Settings → API Keys to add your RapidAPI key.');

  const query = buildQuery(filters);
  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: '1',
  });

  if (filters.remoteOnly) params.set('remote_jobs_only', 'true');
  if (filters.datePosted && filters.datePosted !== 'any') {
    const map: Record<string, string> = { today: 'today', week: '3days', month: 'month' };
    params.set('date_posted', map[filters.datePosted] || 'all');
  }
  if (filters.employmentType) params.set('employment_types', filters.employmentType as string);
  if (filters.location) params.set('query', `${query} in ${filters.location}`);

  const res = await fetch(`https://${JSEARCH_HOST}/search?${params.toString()}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': JSEARCH_HOST,
    },
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error('Invalid API key. Check your RapidAPI key in Settings.');
    if (res.status === 429) throw new Error('Rate limit exceeded. Try again later.');
    throw new Error(`Search failed (${res.status})`);
  }

  const data = await res.json();
  const rawJobs: JSearchJob[] = data.data || [];

  let jobs = rawJobs.map(normalizeJob);

  // Client-side filters the API doesn't support
  if (filters.company) {
    jobs = jobs.filter(j => j.company.toLowerCase().includes(filters.company!.toLowerCase()));
  }
  if (filters.easyApplyOnly) {
    jobs = jobs.filter(j => j.easyApply);
  }
  if (filters.salaryMin) {
    jobs = jobs.filter(j => !j.salary || !j.salary.min || j.salary.min >= filters.salaryMin!);
  }
  if (filters.excludeCompanies?.length) {
    jobs = jobs.filter(j => !filters.excludeCompanies!.some(c => j.company.toLowerCase().includes(c.toLowerCase())));
  }
  if (filters.excludeKeywords?.length) {
    jobs = jobs.filter(j => !filters.excludeKeywords!.some(k => j.description.toLowerCase().includes(k.toLowerCase())));
  }
  if (filters.experienceLevel?.length) {
    jobs = jobs.filter(j => filters.experienceLevel!.includes(j.experienceLevel));
  }

  return { jobs, total: data.total || jobs.length };
}
