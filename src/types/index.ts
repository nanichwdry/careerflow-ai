export type ApplicationStatus = 'draft' | 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'archived';
export type WorkPreference = 'remote' | 'hybrid' | 'onsite';
export type DocumentType = 'master_resume' | 'tailored_resume' | 'exported_pdf' | 'exported_docx' | 'uploaded_source';
export type TemplateStyle = 'minimal' | 'modern' | 'executive';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  website?: string;
  onboardingCompleted: boolean;
}

export interface Preferences {
  userId: string;
  targetJobTitles: string[];
  keywords: string[];
  location: string;
  workPreference: WorkPreference;
  yearsOfExperience: number;
  preferredIndustries: string[];
  salaryMin?: number;
  salaryMax?: number;
  visaSponsorshipNeeded: boolean;
  excludedCompanies: string[];
  excludedKeywords: string[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  website?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface ParsedResume {
  fullName: string;
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
}

export interface MasterResume {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  fileSize: number;
  uploadedAt: string;
  parsedData: ParsedResume;
  rawText: string;
  isReadOnly: true;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  style: TemplateStyle;
}

export interface TailoredResume {
  id: string;
  userId: string;
  masterResumeId: string;
  templateId: string;
  targetJobTitle: string;
  jobDescription: string;
  jdSummary: string;
  jdKeywords: string[];
  atsScore: number;
  suggestions: string[];
  parsedData: ParsedResume;
  version: number;
  parentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  jobTitle: string;
  location: string;
  source: string;
  jobDescription: string;
  applicationDate: string;
  status: ApplicationStatus;
  tailoredResumeId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppDocument {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  fileSize: number;
  mimeType: string;
  linkedApplicationId?: string;
  linkedResumeId?: string;
  uploadedAt: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
  archived: 'Archived',
};
