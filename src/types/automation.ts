export type ApplyRunStatus = 'queued' | 'prepared' | 'review_required' | 'submitted' | 'failed' | 'blocked' | 'skipped';
export type NotificationType = 'new_match' | 'review_needed' | 'app_submitted' | 'app_failed' | 'resume_generated' | 'follow_up';
export type ConnectorCapability = 'search' | 'save' | 'apply';

export interface AutomationSettings {
  userId: string;
  autoApplyEnabled: boolean;
  assistedApplyOnly: boolean;
  matchThreshold: number;
  minSalary: number;
  targetTitles: string[];
  excludedCompanies: string[];
  excludedKeywords: string[];
  easyApplyOnly: boolean;
  maxAppsPerDay: number;
  maxAppsPerSource: number;
  approvalRequiredCompanies: string[];
  approvalRequiredPortals: string[];
  coverLetterEnabled: boolean;
  resumeStyle: 'minimal' | 'modern' | 'executive';
  duplicateDetection: boolean;
  notifyOnMatch: boolean;
  notifyOnSubmit: boolean;
  notifyOnFail: boolean;
  notifyOnReview: boolean;
  notifyFollowUp: boolean;
}

export interface ApplicationPacket {
  id: string;
  userId: string;
  jobId: string;
  jobSnapshot: {
    title: string;
    company: string;
    location: string;
    source: string;
    sourceUrl: string;
    description: string;
  };
  tailoredResumeId?: string;
  coverLetterId?: string;
  contactData: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    website?: string;
  };
  notes: string;
  complianceFlags: {
    duplicateCheck: 'passed' | 'warning' | 'failed';
    sourceSupported: boolean;
    automationAllowed: boolean;
    userApproved: boolean;
  };
  status: 'draft' | 'ready' | 'submitted' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ApplyRun {
  id: string;
  userId: string;
  jobId: string;
  packetId: string;
  connectorId: string;
  status: ApplyRunStatus;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string;
  entityType: 'job' | 'application' | 'resume' | 'cover_letter' | 'packet' | 'automation' | 'notification' | 'review';
  entityId: string;
  action: string;
  result: 'success' | 'failure' | 'warning' | 'info';
  source: string;
  message: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export interface SourceConnector {
  id: string;
  name: string;
  type: 'api' | 'feed' | 'manual' | 'mock';
  capabilities: ConnectorCapability[];
  enabled: boolean;
  limitations: string[];
  requiredFields: string[];
  fallbackBehavior: 'review_queue' | 'skip' | 'manual';
  status: 'active' | 'inactive' | 'error';
  lastChecked?: string;
}

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  condition: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'neq' | 'contains' | 'not_contains';
    value: string | number | boolean;
  };
  action: 'auto_prepare' | 'skip' | 'review' | 'prioritize';
  priority: number;
}

export interface FollowUpReminder {
  id: string;
  userId: string;
  applicationId: string;
  dueDate: string;
  message: string;
  completed: boolean;
  createdAt: string;
}

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  userId: '',
  autoApplyEnabled: false,
  assistedApplyOnly: true,
  matchThreshold: 75,
  minSalary: 0,
  targetTitles: [],
  excludedCompanies: [],
  excludedKeywords: [],
  easyApplyOnly: false,
  maxAppsPerDay: 10,
  maxAppsPerSource: 5,
  approvalRequiredCompanies: [],
  approvalRequiredPortals: [],
  coverLetterEnabled: true,
  resumeStyle: 'modern',
  duplicateDetection: true,
  notifyOnMatch: true,
  notifyOnSubmit: true,
  notifyOnFail: true,
  notifyOnReview: true,
  notifyFollowUp: true,
};
