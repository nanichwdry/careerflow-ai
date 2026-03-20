export type WorkArrangement = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type ApplyMethod = 'easy_apply' | 'external' | 'email' | 'portal';
export type MatchRecommendation = 'strong_match' | 'moderate_match' | 'weak_match';
export type ReviewReason = 'revisit_later' | 'unsupported_source' | 'manual_portal' | 'needs_research' | 'custom';
export type CoverLetterStyle = 'concise' | 'standard' | 'confident';

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period: 'yearly' | 'monthly' | 'hourly';
}

export interface Job {
  id: string;
  sourceId: string;
  sourceJobId: string;
  sourceUrl: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  workArrangement: WorkArrangement;
  salary?: SalaryRange;
  postedDate: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  description: string;
  applyMethod: ApplyMethod;
  easyApply: boolean;
  industry?: string;
  visaSponsorship?: boolean;
  skills?: string[];
  fetchedAt: string;
}

export interface SavedJob {
  id: string;
  jobId: string;
  userId: string;
  savedAt: string;
  status: 'saved' | 'not_interested';
  notes?: string;
  applicationId?: string;
  tailoredResumeId?: string;
}

export interface JobAnalysis {
  id: string;
  jobId: string;
  userId: string;
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  atsKeywords: string[];
  missingSkills: string[];
  matchingSkills: string[];
  fitScore: number;
  recommendation: MatchRecommendation;
  suggestedResumeEmphasis: string[];
  suggestedCoverLetterAngle: string;
  shouldApply: 'yes' | 'maybe' | 'skip';
  analyzedAt: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  tailoredResumeId?: string;
  style: CoverLetterStyle;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  userId: string;
  jobId: string;
  reason: ReviewReason;
  customReason?: string;
  suggestedAction: string;
  tailoredResumeId?: string;
  addedAt: string;
  status: 'pending' | 'completed' | 'dismissed';
}

export interface JobSearchFilters {
  keyword?: string;
  jobTitle?: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  datePosted?: 'today' | 'week' | 'month' | 'any';
  easyApplyOnly?: boolean;
  company?: string;
  industry?: string;
  experienceLevel?: ExperienceLevel[];
  visaSponsorship?: boolean;
  excludeKeywords?: string[];
  excludeCompanies?: string[];
}
