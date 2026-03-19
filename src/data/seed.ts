import type { MasterResume, ResumeTemplate, TailoredResume, Application, AppDocument, UserProfile, Preferences, ParsedResume } from '@/types';

const DEMO_USER_ID = 'demo-user-001';

const masterParsedData: ParsedResume = {
  fullName: 'Alexandra Chen',
  contact: {
    email: 'alexandra.chen@email.com',
    phone: '(415) 555-0192',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/alexandrachen',
    website: 'alexandrachen.dev',
  },
  summary: 'Senior Full-Stack Engineer with 7+ years of experience building scalable web applications and distributed systems. Proven track record of leading cross-functional teams, architecting microservices platforms, and delivering products that serve millions of users. Deep expertise in React, TypeScript, Node.js, and cloud infrastructure.',
  skills: [
    'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Go',
    'PostgreSQL', 'Redis', 'MongoDB', 'AWS', 'Docker', 'Kubernetes',
    'GraphQL', 'REST APIs', 'CI/CD', 'Terraform', 'System Design',
    'Agile/Scrum', 'Technical Leadership', 'Performance Optimization',
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Stripe',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: '',
      current: true,
      bullets: [
        'Led redesign of the merchant dashboard serving 3M+ businesses, improving page load times by 40% through code splitting and lazy loading strategies',
        'Architected and implemented a real-time notification system processing 50K+ events per second using WebSockets and Redis pub/sub',
        'Mentored a team of 5 junior engineers, conducting weekly code reviews and establishing coding standards adopted across 3 teams',
        'Designed and built a feature flag system that reduced deployment risk and enabled 30% faster feature rollouts',
      ],
    },
    {
      id: 'exp-2',
      company: 'Airbnb',
      title: 'Software Engineer II',
      location: 'San Francisco, CA',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      bullets: [
        'Built and maintained core search infrastructure handling 100M+ queries per month using Elasticsearch and custom ranking algorithms',
        'Developed a machine learning pipeline for dynamic pricing suggestions that increased host revenue by 12%',
        'Implemented end-to-end testing framework that reduced production bugs by 35% across the booking flow',
        'Collaborated with design team to rebuild the host onboarding experience, increasing completion rate from 64% to 82%',
      ],
    },
    {
      id: 'exp-3',
      company: 'Dropbox',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2016-08',
      endDate: '2018-05',
      current: false,
      bullets: [
        'Developed file synchronization features for the desktop client used by 500M+ users',
        'Optimized database queries reducing API response times by 60% for the file metadata service',
        'Built internal developer tools that improved team productivity and reduced build times by 25%',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Stanford University',
      degree: 'Master of Science',
      field: 'Computer Science',
      graduationDate: '2016-06',
      gpa: '3.9',
    },
    {
      id: 'edu-2',
      institution: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science & Mathematics',
      graduationDate: '2014-05',
      gpa: '3.8',
    },
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023-01' },
    { id: 'cert-2', name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022-06' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'OpenTrace',
      description: 'Open-source distributed tracing library for Node.js microservices with automatic instrumentation and Jaeger integration',
      technologies: ['TypeScript', 'Node.js', 'OpenTelemetry', 'Jaeger'],
      url: 'github.com/alexchen/opentrace',
    },
    {
      id: 'proj-2',
      name: 'QueryForge',
      description: 'Type-safe SQL query builder for TypeScript with compile-time validation and automatic migration generation',
      technologies: ['TypeScript', 'PostgreSQL', 'AST Parsing'],
    },
  ],
};

export const seedProfile: UserProfile = {
  userId: DEMO_USER_ID,
  fullName: 'Alexandra Chen',
  email: 'alexandra.chen@email.com',
  phone: '(415) 555-0192',
  location: 'San Francisco, CA',
  linkedIn: 'linkedin.com/in/alexandrachen',
  website: 'alexandrachen.dev',
  onboardingCompleted: true,
};

export const seedPreferences: Preferences = {
  userId: DEMO_USER_ID,
  targetJobTitles: ['Staff Engineer', 'Senior Software Engineer', 'Engineering Manager'],
  keywords: ['distributed systems', 'React', 'TypeScript', 'system design', 'leadership'],
  location: 'San Francisco Bay Area',
  workPreference: 'hybrid',
  yearsOfExperience: 7,
  preferredIndustries: ['FinTech', 'SaaS', 'Developer Tools', 'Cloud Infrastructure'],
  salaryMin: 220000,
  salaryMax: 320000,
  visaSponsorshipNeeded: false,
  excludedCompanies: ['Meta'],
  excludedKeywords: ['blockchain', 'web3'],
};

export const seedMasterResume: MasterResume = {
  id: 'master-001',
  userId: DEMO_USER_ID,
  fileName: 'Alexandra_Chen_Resume_2024.pdf',
  fileType: 'pdf',
  fileSize: 245760,
  uploadedAt: '2024-11-15T10:30:00Z',
  parsedData: masterParsedData,
  rawText: '',
  isReadOnly: true,
};

export const seedTemplates: ResumeTemplate[] = [
  {
    id: 'tpl-minimal',
    name: 'Minimal ATS',
    description: 'Clean single-column layout with maximum ATS compatibility. Simple typography, clear section headers, no decorative elements.',
    style: 'minimal',
  },
  {
    id: 'tpl-modern',
    name: 'Modern Professional',
    description: 'Contemporary professional layout with refined spacing and subtle section dividers. Balanced whitespace for easy scanning.',
    style: 'modern',
  },
  {
    id: 'tpl-executive',
    name: 'Executive Clean',
    description: 'Polished executive-level format with distinguished typography and premium feel. Ideal for senior and leadership roles.',
    style: 'executive',
  },
];

function makeTailored(overrides: Partial<TailoredResume> & { id: string; targetJobTitle: string; jobDescription: string; atsScore: number; templateId: string }): TailoredResume {
  return {
    userId: DEMO_USER_ID,
    masterResumeId: 'master-001',
    jdSummary: '',
    jdKeywords: [],
    suggestions: [],
    parsedData: { ...masterParsedData },
    version: 1,
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
    ...overrides,
  };
}

export const seedTailoredResumes: TailoredResume[] = [
  makeTailored({
    id: 'tailored-001',
    templateId: 'tpl-modern',
    targetJobTitle: 'Staff Engineer – Platform',
    jobDescription: 'We are looking for a Staff Engineer to lead our platform team...',
    jdSummary: 'Staff-level platform engineering role focused on distributed systems, API design, and technical leadership at a high-growth fintech.',
    jdKeywords: ['distributed systems', 'platform engineering', 'API design', 'Kubernetes', 'technical leadership', 'microservices'],
    atsScore: 92,
    suggestions: ['Add more quantified impact metrics for platform work', 'Emphasize cross-team collaboration examples'],
    parsedData: { ...masterParsedData, summary: 'Staff-level Platform Engineer with 7+ years of experience architecting distributed systems and leading cross-functional platform initiatives. Expert in designing scalable APIs, orchestrating microservices on Kubernetes, and driving technical strategy across engineering organizations.' },
    createdAt: '2024-12-10T14:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
  }),
  makeTailored({
    id: 'tailored-002',
    templateId: 'tpl-minimal',
    targetJobTitle: 'Senior Frontend Engineer',
    jobDescription: 'Join our team as a Senior Frontend Engineer building next-gen developer tools...',
    jdSummary: 'Senior frontend role at a developer tools company, emphasizing React/TypeScript expertise, performance optimization, and design system work.',
    jdKeywords: ['React', 'TypeScript', 'performance optimization', 'design systems', 'accessibility', 'testing'],
    atsScore: 88,
    suggestions: ['Highlight more frontend-specific achievements', 'Mention accessibility experience'],
    createdAt: '2024-12-08T11:30:00Z',
    updatedAt: '2024-12-08T11:30:00Z',
  }),
  makeTailored({
    id: 'tailored-003',
    templateId: 'tpl-executive',
    targetJobTitle: 'Engineering Manager',
    jobDescription: 'We need an Engineering Manager to lead a team of 8-12 engineers...',
    jdSummary: 'Engineering management position leading a mid-size team, requiring both technical depth and people leadership skills.',
    jdKeywords: ['engineering management', 'team leadership', 'mentoring', 'agile', 'roadmap planning', 'hiring'],
    atsScore: 78,
    suggestions: ['Expand on mentoring and team-building experiences', 'Add more about roadmap planning and stakeholder communication'],
    createdAt: '2024-12-05T09:15:00Z',
    updatedAt: '2024-12-05T09:15:00Z',
  }),
  makeTailored({
    id: 'tailored-004',
    templateId: 'tpl-modern',
    targetJobTitle: 'Senior Backend Engineer',
    jobDescription: 'Looking for a Senior Backend Engineer to scale our payment processing infrastructure...',
    jdSummary: 'Backend-focused role at a payments company requiring expertise in high-throughput systems, databases, and reliability engineering.',
    jdKeywords: ['backend', 'payments', 'PostgreSQL', 'scalability', 'reliability', 'Go', 'Python'],
    atsScore: 85,
    suggestions: ['Emphasize payment/fintech domain experience from Stripe', 'Add more database optimization examples'],
    createdAt: '2024-12-03T16:45:00Z',
    updatedAt: '2024-12-03T16:45:00Z',
  }),
  makeTailored({
    id: 'tailored-005',
    templateId: 'tpl-minimal',
    targetJobTitle: 'Full-Stack Tech Lead',
    jobDescription: 'Seeking a Tech Lead to own our core product engineering...',
    jdSummary: 'Tech lead role requiring full-stack expertise and the ability to own product engineering end-to-end at a Series B SaaS startup.',
    jdKeywords: ['tech lead', 'full-stack', 'product engineering', 'React', 'Node.js', 'AWS', 'startup'],
    atsScore: 90,
    suggestions: ['Highlight end-to-end product ownership experiences'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  }),
];

export const seedApplications: Application[] = [
  {
    id: 'app-001', userId: DEMO_USER_ID, company: 'Vercel', jobTitle: 'Staff Engineer – Platform',
    location: 'San Francisco, CA (Hybrid)', source: 'LinkedIn', jobDescription: 'We are looking for a Staff Engineer to lead our platform team...',
    applicationDate: '2024-12-12', status: 'interview', tailoredResumeId: 'tailored-001',
    notes: 'Completed first round. Technical interview scheduled for Dec 20.', createdAt: '2024-12-10T14:30:00Z', updatedAt: '2024-12-15T09:00:00Z',
  },
  {
    id: 'app-002', userId: DEMO_USER_ID, company: 'Linear', jobTitle: 'Senior Frontend Engineer',
    location: 'Remote', source: 'Company Website', jobDescription: 'Join our team as a Senior Frontend Engineer building next-gen developer tools...',
    applicationDate: '2024-12-09', status: 'applied', tailoredResumeId: 'tailored-002',
    notes: 'Applied via careers page. Referral from David.', createdAt: '2024-12-08T12:00:00Z', updatedAt: '2024-12-09T10:00:00Z',
  },
  {
    id: 'app-003', userId: DEMO_USER_ID, company: 'Notion', jobTitle: 'Engineering Manager',
    location: 'San Francisco, CA', source: 'Recruiter', jobDescription: 'We need an Engineering Manager to lead a team of 8-12 engineers...',
    applicationDate: '2024-12-06', status: 'rejected', tailoredResumeId: 'tailored-003',
    notes: 'Rejected after second round. Feedback: looking for someone with more direct management experience.', createdAt: '2024-12-05T10:00:00Z', updatedAt: '2024-12-14T15:00:00Z',
  },
  {
    id: 'app-004', userId: DEMO_USER_ID, company: 'Plaid', jobTitle: 'Senior Backend Engineer',
    location: 'San Francisco, CA (Hybrid)', source: 'LinkedIn', jobDescription: 'Looking for a Senior Backend Engineer to scale our payment processing infrastructure...',
    applicationDate: '2024-12-04', status: 'offer', tailoredResumeId: 'tailored-004',
    notes: 'Offer received! $290K base + equity. Deadline to respond: Dec 22.', createdAt: '2024-12-03T17:00:00Z', updatedAt: '2024-12-16T11:00:00Z',
  },
  {
    id: 'app-005', userId: DEMO_USER_ID, company: 'Figma', jobTitle: 'Full-Stack Tech Lead',
    location: 'San Francisco, CA', source: 'Referral', jobDescription: 'Seeking a Tech Lead to own our core product engineering...',
    applicationDate: '2024-12-02', status: 'applied', tailoredResumeId: 'tailored-005',
    notes: 'Referred by Sarah K. Awaiting response.', createdAt: '2024-12-01T10:30:00Z', updatedAt: '2024-12-02T08:00:00Z',
  },
  {
    id: 'app-006', userId: DEMO_USER_ID, company: 'Datadog', jobTitle: 'Staff Engineer – Observability',
    location: 'New York, NY (Hybrid)', source: 'LinkedIn', jobDescription: 'Staff Engineer role focused on observability platform...',
    applicationDate: '', status: 'saved',
    notes: 'Interesting role. Need to tailor resume before applying.', createdAt: '2024-12-11T08:00:00Z', updatedAt: '2024-12-11T08:00:00Z',
  },
  {
    id: 'app-007', userId: DEMO_USER_ID, company: 'Ramp', jobTitle: 'Senior Software Engineer',
    location: 'New York, NY', source: 'Company Website', jobDescription: 'Senior SWE for fintech platform...',
    applicationDate: '', status: 'draft',
    notes: '', createdAt: '2024-12-13T14:00:00Z', updatedAt: '2024-12-13T14:00:00Z',
  },
  {
    id: 'app-008', userId: DEMO_USER_ID, company: 'Coinbase', jobTitle: 'Principal Engineer',
    location: 'Remote', source: 'Recruiter', jobDescription: 'Principal Engineer for platform infrastructure...',
    applicationDate: '2024-11-20', status: 'archived', tailoredResumeId: 'tailored-001',
    notes: 'Decided not to pursue after learning more about the role scope.', createdAt: '2024-11-18T10:00:00Z', updatedAt: '2024-12-01T09:00:00Z',
  },
];

export const seedDocuments: AppDocument[] = [
  { id: 'doc-001', userId: DEMO_USER_ID, name: 'Alexandra_Chen_Resume_2024.pdf', type: 'master_resume', fileSize: 245760, mimeType: 'application/pdf', linkedResumeId: 'master-001', uploadedAt: '2024-11-15T10:30:00Z' },
  { id: 'doc-002', userId: DEMO_USER_ID, name: 'Staff_Engineer_Platform_Vercel.pdf', type: 'exported_pdf', fileSize: 198400, mimeType: 'application/pdf', linkedResumeId: 'tailored-001', linkedApplicationId: 'app-001', uploadedAt: '2024-12-10T14:15:00Z' },
  { id: 'doc-003', userId: DEMO_USER_ID, name: 'Staff_Engineer_Platform_Vercel.docx', type: 'exported_docx', fileSize: 156800, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', linkedResumeId: 'tailored-001', linkedApplicationId: 'app-001', uploadedAt: '2024-12-10T14:16:00Z' },
  { id: 'doc-004', userId: DEMO_USER_ID, name: 'Senior_Frontend_Linear.pdf', type: 'exported_pdf', fileSize: 189440, mimeType: 'application/pdf', linkedResumeId: 'tailored-002', linkedApplicationId: 'app-002', uploadedAt: '2024-12-08T12:00:00Z' },
  { id: 'doc-005', userId: DEMO_USER_ID, name: 'Engineering_Manager_Notion.pdf', type: 'exported_pdf', fileSize: 201728, mimeType: 'application/pdf', linkedResumeId: 'tailored-003', linkedApplicationId: 'app-003', uploadedAt: '2024-12-05T10:00:00Z' },
  { id: 'doc-006', userId: DEMO_USER_ID, name: 'Senior_Backend_Plaid.pdf', type: 'exported_pdf', fileSize: 195584, mimeType: 'application/pdf', linkedResumeId: 'tailored-004', linkedApplicationId: 'app-004', uploadedAt: '2024-12-03T17:00:00Z' },
  { id: 'doc-007', userId: DEMO_USER_ID, name: 'Senior_Backend_Plaid.docx', type: 'exported_docx', fileSize: 162816, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', linkedResumeId: 'tailored-004', linkedApplicationId: 'app-004', uploadedAt: '2024-12-03T17:01:00Z' },
  { id: 'doc-008', userId: DEMO_USER_ID, name: 'FullStack_TechLead_Figma.pdf', type: 'exported_pdf', fileSize: 192512, mimeType: 'application/pdf', linkedResumeId: 'tailored-005', linkedApplicationId: 'app-005', uploadedAt: '2024-12-01T10:30:00Z' },
];
