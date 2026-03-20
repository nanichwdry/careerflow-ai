import type { ResumeTemplate } from '@/types';
import type { SourceConnector } from '@/types/automation';

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'tpl-minimal',
    name: 'Minimal ATS',
    description: 'Clean single-column layout with maximum ATS compatibility.',
    style: 'minimal',
  },
  {
    id: 'tpl-modern',
    name: 'Modern Professional',
    description: 'Contemporary layout with refined spacing and subtle dividers.',
    style: 'modern',
  },
  {
    id: 'tpl-executive',
    name: 'Executive Clean',
    description: 'Polished executive-level format. Ideal for senior roles.',
    style: 'executive',
  },
];

export const defaultConnectors: SourceConnector[] = [
  {
    id: 'linkedin-api',
    name: 'LinkedIn Jobs',
    type: 'api',
    capabilities: ['search', 'save'],
    enabled: false,
    limitations: ['Requires OAuth token', 'Rate limited to 100 req/day', 'Apply not supported via API'],
    requiredFields: ['accessToken'],
    fallbackBehavior: 'review_queue',
    status: 'inactive',
  },
  {
    id: 'indeed-feed',
    name: 'Indeed',
    type: 'feed',
    capabilities: ['search'],
    enabled: false,
    limitations: ['XML feed only', 'No direct apply support'],
    requiredFields: ['publisherId'],
    fallbackBehavior: 'review_queue',
    status: 'inactive',
  },
  {
    id: 'greenhouse-api',
    name: 'Greenhouse',
    type: 'api',
    capabilities: ['search', 'apply'],
    enabled: false,
    limitations: ['Per-company board tokens required', 'Apply requires candidate consent'],
    requiredFields: ['boardToken'],
    fallbackBehavior: 'manual',
    status: 'inactive',
  },
  {
    id: 'lever-api',
    name: 'Lever',
    type: 'api',
    capabilities: ['search', 'apply'],
    enabled: false,
    limitations: ['Per-company API', 'Apply requires form submission'],
    requiredFields: ['siteId'],
    fallbackBehavior: 'manual',
    status: 'inactive',
  },
  {
    id: 'manual-entry',
    name: 'Manual Entry',
    type: 'manual',
    capabilities: ['search', 'save'],
    enabled: true,
    limitations: ['User must manually enter job details'],
    requiredFields: [],
    fallbackBehavior: 'manual',
    status: 'active',
  },
];
