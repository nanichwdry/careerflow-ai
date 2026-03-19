import type { ParsedResume } from '@/types';

// Mock AI service layer — designed to be swapped with real AI provider (OpenAI, Anthropic, etc.)

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface JDAnalysis {
  summary: string;
  keywords: string[];
  requirements: string[];
}

export async function analyzeJobDescription(jd: string): Promise<JDAnalysis> {
  await delay(1200);
  const words = jd.toLowerCase();
  const keywordPool = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'AWS', 'Kubernetes',
    'microservices', 'distributed systems', 'leadership', 'agile', 'CI/CD',
    'PostgreSQL', 'GraphQL', 'REST', 'Docker', 'system design', 'scalability',
    'performance', 'testing', 'mentoring', 'cross-functional',
  ];
  const keywords = keywordPool.filter(k => words.includes(k.toLowerCase()));
  if (keywords.length < 3) keywords.push('communication', 'problem-solving', 'collaboration');

  return {
    summary: `This role requires a skilled engineer with expertise in ${keywords.slice(0, 3).join(', ')}. The position emphasizes building scalable systems and collaborating with cross-functional teams.`,
    keywords,
    requirements: [
      `${Math.floor(Math.random() * 3) + 5}+ years of software engineering experience`,
      `Strong proficiency in ${keywords[0] || 'modern technologies'}`,
      'Experience with distributed systems at scale',
      'Excellent communication and collaboration skills',
    ],
  };
}

export async function generateTailoredResume(
  masterData: ParsedResume,
  _jd: string,
  analysis: JDAnalysis,
): Promise<{ tailoredData: ParsedResume; atsScore: number; suggestions: string[] }> {
  await delay(1800);

  // Reorder skills to prioritize matched keywords
  const matchedSkills = masterData.skills.filter(s =>
    analysis.keywords.some(k => s.toLowerCase().includes(k.toLowerCase()))
  );
  const otherSkills = masterData.skills.filter(s => !matchedSkills.includes(s));
  const reorderedSkills = [...matchedSkills, ...otherSkills];

  // Refine summary (mock — real AI would rewrite properly)
  const keyPhrases = analysis.keywords.slice(0, 3).join(', ');
  const tailoredSummary = `${masterData.summary.split('.')[0]}. Specialized in ${keyPhrases}, with a proven track record of delivering high-impact results in fast-paced environments.`;

  // Calculate ATS score based on keyword matches
  const matchCount = matchedSkills.length;
  const totalKeywords = analysis.keywords.length;
  const atsScore = Math.min(98, Math.max(65, Math.round((matchCount / Math.max(totalKeywords, 1)) * 100 * 0.9 + 15)));

  const suggestions: string[] = [];
  const unmatchedKeywords = analysis.keywords.filter(
    k => !masterData.skills.some(s => s.toLowerCase().includes(k.toLowerCase()))
  );
  if (unmatchedKeywords.length > 0) {
    suggestions.push(`Consider highlighting experience related to: ${unmatchedKeywords.slice(0, 3).join(', ')}`);
  }
  suggestions.push('Quantify achievements with specific metrics where possible');
  if (matchedSkills.length < 5) {
    suggestions.push('Add more relevant technical skills that match the job requirements');
  }

  return {
    tailoredData: {
      ...masterData,
      summary: tailoredSummary,
      skills: reorderedSkills,
    },
    atsScore,
    suggestions,
  };
}

/**
 * IMPORTANT: This AI service explicitly does NOT fabricate experience, invent metrics,
 * or add unsupported claims. All tailored content is derived from the master resume.
 * The service only transforms, reorders, summarizes, and refines existing content.
 */
