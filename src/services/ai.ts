import OpenAI from 'openai';
import type { ParsedResume } from '@/types';
import type { Job, JobAnalysis, CoverLetter, CoverLetterStyle, MatchRecommendation } from '@/types/jobs';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '<your_openai_api_key>',
  dangerouslyAllowBrowser: true,
});

const MODEL = 'gpt-4o-mini';

async function chatJSON<T>(system: string, user: string): Promise<T> {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  return JSON.parse(res.choices[0].message.content || '{}') as T;
}

export interface JDAnalysis {
  summary: string;
  keywords: string[];
  requirements: string[];
}

export async function analyzeJobDescription(jd: string): Promise<JDAnalysis> {
  return chatJSON<JDAnalysis>(
    `You are a job description analyst. Analyze the given JD and return JSON with:
- "summary": 2-3 sentence summary of the role
- "keywords": array of technical/professional keywords found
- "requirements": array of key requirements`,
    jd,
  );
}

export async function generateTailoredResume(
  masterData: ParsedResume,
  jd: string,
  analysis: JDAnalysis,
): Promise<{ tailoredData: ParsedResume; atsScore: number; suggestions: string[] }> {
  const result = await chatJSON<{
    summary: string;
    skills: string[];
    atsScore: number;
    suggestions: string[];
  }>(
    `You are an expert resume tailor. Given a master resume and JD analysis, optimize the resume for ATS.
Return JSON with:
- "summary": rewritten professional summary targeting this JD (use ONLY facts from the master resume, do NOT invent experience)
- "skills": reordered skills array, matching JD keywords first
- "atsScore": estimated ATS match score 0-100
- "suggestions": array of actionable improvement suggestions`,
    JSON.stringify({
      masterResume: { summary: masterData.summary, skills: masterData.skills, experience: masterData.experience.map(e => ({ title: e.title, company: e.company, bullets: e.bullets })) },
      jdKeywords: analysis.keywords,
      jdRequirements: analysis.requirements,
      jobDescription: jd.slice(0, 2000),
    }),
  );

  return {
    tailoredData: { ...masterData, summary: result.summary, skills: result.skills },
    atsScore: result.atsScore,
    suggestions: result.suggestions,
  };
}

export async function analyzeJobFit(
  job: Job,
  resumeData: ParsedResume | string[],
  userId: string,
): Promise<JobAnalysis> {
  // Accept either a full ParsedResume or a legacy string[] of skills
  const parsed: Partial<ParsedResume> = Array.isArray(resumeData)
    ? { skills: resumeData, experience: [], summary: '' }
    : resumeData;

  const candidateContext = {
    skills: parsed.skills || [],
    summary: parsed.summary || '',
    // Send ALL roles and ALL bullets — never truncate candidate data
    allExperience: (parsed.experience || []).map(e => ({
      title: e.title,
      company: e.company,
      startDate: e.startDate,
      endDate: e.current ? 'Present' : e.endDate,
      bullets: e.bullets || [],
    })),
  };

  const result = await chatJSON<{
    summary: string;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    atsKeywords: string[];
    missingSkills: string[];
    matchingSkills: string[];
    fitScore: number;
    recommendation: string;
    suggestedResumeEmphasis: string[];
    suggestedCoverLetterAngle: string;
    shouldApply: string;
  }>(
    `You are an expert recruiter analyzing candidate fit for a job.

MATCHING RULES — follow these strictly:
1. Use SEMANTIC matching, not just exact string matching:
   - "Angular" matches "AngularJS", "Angular 2+", "Angular 14", etc.
   - "React" matches "ReactJS", "React.js", "React Native (web)"
   - "JavaScript" matches "JS", "ES6", "ES2015+", "Vanilla JS"
   - "HTML" matches "HTML5", "HTML/CSS", "HTML & CSS"
   - "CSS" matches "CSS3", "SCSS", "Sass", "Tailwind CSS", "Bootstrap"
   - "Node" matches "Node.js", "NodeJS", "Express.js"
   - Any version suffix or alias should be treated as the same skill
2. A skill counts as MATCHING if it appears in candidateSkills OR anywhere in allExperience bullets/titles
3. Only mark a skill as MISSING if there is genuinely NO evidence of it anywhere in the candidate data
4. Do NOT penalize the candidate for not using the exact same wording as the job description

Return JSON:
- "summary": 2-sentence honest fit summary
- "requiredSkills": skills the job explicitly requires
- "preferredSkills": nice-to-have skills from the job
- "responsibilities": key job responsibilities
- "atsKeywords": important ATS keywords from the job description
- "matchingSkills": skills the candidate has (use the job's terminology, e.g. if job says "Angular" and candidate has "AngularJS", list "Angular")
- "missingSkills": skills with NO evidence anywhere in the candidate's data
- "fitScore": 0-100 integer based on how well candidate matches requirements
- "recommendation": one of "strong_match", "moderate_match", "weak_match"
- "suggestedResumeEmphasis": which of the candidate's actual skills/experiences to highlight
- "suggestedCoverLetterAngle": one sentence strategy
- "shouldApply": one of "yes", "maybe", "skip"`,
    JSON.stringify({
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description.slice(0, 3000),
      candidateSkills: candidateContext.skills,
      candidateSummary: candidateContext.summary,
      candidateExperience: candidateContext.allExperience,
    }),
  );

  return {
    id: crypto.randomUUID(),
    jobId: job.id,
    userId,
    summary: result.summary,
    requiredSkills: result.requiredSkills,
    preferredSkills: result.preferredSkills,
    responsibilities: result.responsibilities,
    atsKeywords: result.atsKeywords,
    missingSkills: result.missingSkills,
    matchingSkills: result.matchingSkills,
    fitScore: result.fitScore,
    recommendation: result.recommendation as MatchRecommendation,
    suggestedResumeEmphasis: result.suggestedResumeEmphasis,
    suggestedCoverLetterAngle: result.suggestedCoverLetterAngle,
    shouldApply: result.shouldApply as 'yes' | 'maybe' | 'skip',
    analyzedAt: new Date().toISOString(),
  };
}

export async function generateCoverLetter(
  job: Job,
  masterData: ParsedResume,
  style: CoverLetterStyle,
  userId: string,
  tailoredResumeId?: string,
): Promise<CoverLetter> {
  const result = await chatJSON<{ content: string }>(
    `You are a professional cover letter writer. Write a cover letter based ONLY on the candidate's real experience.
Style: ${style} (concise = brief and direct, standard = balanced, confident = assertive and bold).
Do NOT invent experience or metrics. Return JSON with "content" field containing the full letter.`,
    JSON.stringify({
      jobTitle: job.title,
      company: job.company,
      description: job.description.slice(0, 2000),
      candidate: {
        name: masterData.fullName,
        email: masterData.contact.email,
        phone: masterData.contact.phone,
        summary: masterData.summary,
        skills: masterData.skills.slice(0, 10),
        latestRole: masterData.experience[0] ? {
          title: masterData.experience[0].title,
          company: masterData.experience[0].company,
          bullets: masterData.experience[0].bullets.slice(0, 3),
        } : null,
      },
    }),
  );

  return {
    id: crypto.randomUUID(),
    userId,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    tailoredResumeId,
    style,
    content: result.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface AIAssistantResponse {
  message: string;
  suggestions?: string[];
}

export async function askAIAssistant(
  context: 'job_detail' | 'application' | 'resume',
  question: string,
  entityData: Record<string, unknown>,
): Promise<AIAssistantResponse> {
  return chatJSON<AIAssistantResponse>(
    `You are a helpful career assistant embedded in a job application tracker. Context: ${context}.
Answer the user's question concisely. Return JSON with "message" (string) and "suggestions" (array of actionable next steps).`,
    JSON.stringify({ question, context: entityData }),
  );
}

export interface ParsedEmailJob {
  title: string;
  company: string;
  location: string;
  workArrangement: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salary: string | null;
  applyUrl: string | null;
  isJobRelated: boolean;
}

/**
 * Parse a raw email into structured job data using AI.
 * Returns isJobRelated=false for newsletters, unsubscribe emails, etc.
 */
export async function parseEmailJob(
  subject: string,
  from: string,
  body: string,
): Promise<ParsedEmailJob> {
  return chatJSON<ParsedEmailJob>(
    `You are a job email parser. Given an email's subject, sender, and body, extract job information.
Return JSON with:
- "title": job title string (empty string if not clearly a job posting)
- "company": company name (extract from sender domain or body, empty string if unknown)
- "location": job location string (city/state/country or "Remote", empty string if not found)
- "workArrangement": one of "remote", "hybrid", "onsite", "unknown"
- "salary": salary text if explicitly mentioned (null if not)
- "applyUrl": the primary apply/view job URL found in the body (null if none)
- "isJobRelated": true only if this email is an actual job opportunity or job alert, false for newsletters/marketing/unsubscribe`,
    JSON.stringify({ subject, from, body: body.slice(0, 1500) }),
  );
}

/**
 * IMPORTANT: This AI service does NOT fabricate experience, invent metrics,
 * or add unsupported claims. All content is derived from the master resume.
 * The service only transforms, reorders, summarizes, and refines existing content.
 */
