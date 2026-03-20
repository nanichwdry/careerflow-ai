import type { Job } from '@/types/jobs';
import type { Application } from '@/types';
import type {
  AutomationSettings,
  AutomationRule,
  ApplicationPacket,
  ApplyRun,
  ActivityLog,
  AppNotification,
  SourceConnector,
} from '@/types/automation';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export function checkDuplicate(
  job: Job,
  applications: Application[],
): { isDuplicate: boolean; existingApp?: Application } {
  const existing = applications.find(a =>
    a.company.toLowerCase() === job.company.toLowerCase() &&
    a.jobTitle.toLowerCase() === job.title.toLowerCase()
  );
  return { isDuplicate: !!existing, existingApp: existing };
}

export function evaluateRules(
  job: Job,
  fitScore: number,
  rules: AutomationRule[],
): { action: AutomationRule['action']; matchedRule?: AutomationRule } {
  const sorted = [...rules].filter(r => r.enabled).sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const { field, operator, value } = rule.condition;
    let fieldValue: unknown;

    switch (field) {
      case 'fitScore': fieldValue = fitScore; break;
      case 'salary': fieldValue = job.salary?.min || 0; break;
      case 'workArrangement': fieldValue = job.workArrangement; break;
      case 'company': fieldValue = job.company; break;
      case 'easyApply': fieldValue = job.easyApply; break;
      case 'visaSponsorship': fieldValue = job.visaSponsorship; break;
      default: continue;
    }

    let matches = false;
    switch (operator) {
      case 'gt': matches = Number(fieldValue) > Number(value); break;
      case 'lt': matches = Number(fieldValue) < Number(value); break;
      case 'eq': matches = fieldValue === value; break;
      case 'neq': matches = fieldValue !== value; break;
      case 'contains': matches = String(fieldValue).toLowerCase().includes(String(value).toLowerCase()); break;
      case 'not_contains': matches = !String(fieldValue).toLowerCase().includes(String(value).toLowerCase()); break;
    }

    if (matches) return { action: rule.action, matchedRule: rule };
  }

  return { action: 'auto_prepare' };
}

export function checkRateLimits(
  settings: AutomationSettings,
  todayRuns: ApplyRun[],
  sourceId: string,
): { allowed: boolean; reason?: string } {
  const todayCount = todayRuns.filter(r => r.status === 'submitted').length;
  if (todayCount >= settings.maxAppsPerDay) {
    return { allowed: false, reason: `Daily limit reached (${settings.maxAppsPerDay}/day)` };
  }

  const sourceCount = todayRuns.filter(r => r.connectorId === sourceId && r.status === 'submitted').length;
  if (sourceCount >= settings.maxAppsPerSource) {
    return { allowed: false, reason: `Source limit reached (${settings.maxAppsPerSource}/source)` };
  }

  return { allowed: true };
}

export function checkConnectorSupport(
  connector: SourceConnector | undefined,
  action: 'apply' | 'search' | 'save',
): { supported: boolean; fallback?: string } {
  if (!connector) return { supported: false, fallback: 'No connector configured' };
  if (!connector.enabled) return { supported: false, fallback: 'Connector disabled' };
  if (connector.status === 'error') return { supported: false, fallback: 'Connector in error state' };
  if (!connector.capabilities.includes(action)) {
    return { supported: false, fallback: `Connector does not support ${action}` };
  }
  return { supported: true };
}

export function buildApplicationPacket(
  job: Job,
  userId: string,
  contactData: ApplicationPacket['contactData'],
  options: {
    tailoredResumeId?: string;
    coverLetterId?: string;
    notes?: string;
    duplicateCheck: ApplicationPacket['complianceFlags']['duplicateCheck'];
    sourceSupported: boolean;
  },
): ApplicationPacket {
  return {
    id: crypto.randomUUID(),
    userId,
    jobId: job.id,
    jobSnapshot: {
      title: job.title,
      company: job.company,
      location: job.location,
      source: job.sourceId,
      sourceUrl: job.sourceUrl,
      description: job.description,
    },
    tailoredResumeId: options.tailoredResumeId,
    coverLetterId: options.coverLetterId,
    contactData,
    notes: options.notes || '',
    complianceFlags: {
      duplicateCheck: options.duplicateCheck,
      sourceSupported: options.sourceSupported,
      automationAllowed: options.sourceSupported,
      userApproved: false,
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function executeApplyRun(
  packet: ApplicationPacket,
  connector: SourceConnector | undefined,
): Promise<ApplyRun> {
  await delay(2000);

  const run: ApplyRun = {
    id: crypto.randomUUID(),
    userId: packet.userId,
    jobId: packet.jobId,
    packetId: packet.id,
    connectorId: connector?.id || 'unknown',
    status: 'queued',
    startedAt: new Date().toISOString(),
    retryCount: 0,
  };

  if (!connector || !connector.capabilities.includes('apply')) {
    run.status = 'review_required';
    run.errorMessage = 'Source does not support automated apply. Sent to review queue.';
    run.completedAt = new Date().toISOString();
    return run;
  }

  if (!packet.complianceFlags.userApproved) {
    run.status = 'review_required';
    run.errorMessage = 'User approval required before submission.';
    run.completedAt = new Date().toISOString();
    return run;
  }

  if (packet.complianceFlags.duplicateCheck === 'failed') {
    run.status = 'blocked';
    run.errorMessage = 'Duplicate application detected.';
    run.completedAt = new Date().toISOString();
    return run;
  }

  // In production, this would call the actual connector's submit method
  run.status = 'submitted';
  run.completedAt = new Date().toISOString();
  return run;
}

export function createActivityLog(
  userId: string,
  entityType: ActivityLog['entityType'],
  entityId: string,
  action: string,
  result: ActivityLog['result'],
  source: string,
  message: string,
): ActivityLog {
  return {
    id: crypto.randomUUID(),
    userId,
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    action,
    result,
    source,
    message,
  };
}

export function createNotification(
  userId: string,
  type: AppNotification['type'],
  title: string,
  message: string,
  entityType?: string,
  entityId?: string,
): AppNotification {
  return {
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}
