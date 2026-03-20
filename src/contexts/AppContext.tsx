import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { MasterResume, TailoredResume, Application, AppDocument, ResumeTemplate, ApplicationStatus } from '@/types';
import type { Job, SavedJob, JobAnalysis, CoverLetter, ReviewQueueItem } from '@/types/jobs';
import type {
  AutomationSettings, ApplicationPacket, ApplyRun, ActivityLog,
  AppNotification, SourceConnector, AutomationRule, FollowUpReminder,
} from '@/types/automation';
import type { EmailJob, GmailSyncState } from '@/types/gmail';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';
import { resumeTemplates, defaultConnectors } from '@/data/seed';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'cf_app_data';

interface PersistedState {
  masterResume: MasterResume | null;
  tailoredResumes: TailoredResume[];
  applications: Application[];
  documents: AppDocument[];
  jobs: Job[];
  savedJobs: SavedJob[];
  jobAnalyses: JobAnalysis[];
  coverLetters: CoverLetter[];
  reviewQueue: ReviewQueueItem[];
  automationSettings: AutomationSettings | null;
  packets: ApplicationPacket[];
  applyRuns: ApplyRun[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  connectors: SourceConnector[];
  rules: AutomationRule[];
  reminders: FollowUpReminder[];
  emailJobs: EmailJob[];
  gmail: GmailSyncState;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted storage */ }
  return {
    masterResume: null, tailoredResumes: [], applications: [], documents: [],
    jobs: [], savedJobs: [], jobAnalyses: [], coverLetters: [], reviewQueue: [],
    automationSettings: null, packets: [], applyRuns: [], activityLogs: [],
    notifications: [], connectors: defaultConnectors, rules: [], reminders: [],
    emailJobs: [], gmail: { connected: false, lastSync: null },
  };
}

interface AppState extends PersistedState {
  templates: ResumeTemplate[];
  // Phase 1
  setMasterResume: (r: MasterResume) => void;
  addTailoredResume: (r: TailoredResume) => void;
  addApplication: (a: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  addDocument: (d: AppDocument) => void;
  // Phase 2
  addJob: (j: Job) => void;
  addJobs: (js: Job[]) => void;
  removeJob: (id: string) => void;
  saveJob: (s: SavedJob) => void;
  updateSavedJob: (id: string, updates: Partial<SavedJob>) => void;
  removeSavedJob: (id: string) => void;
  addJobAnalysis: (a: JobAnalysis) => void;
  addCoverLetter: (c: CoverLetter) => void;
  updateCoverLetter: (id: string, updates: Partial<CoverLetter>) => void;
  deleteCoverLetter: (id: string) => void;
  addReviewItem: (r: ReviewQueueItem) => void;
  updateReviewItem: (id: string, updates: Partial<ReviewQueueItem>) => void;
  // Phase 3
  setAutomationSettings: (s: AutomationSettings) => void;
  addPacket: (p: ApplicationPacket) => void;
  updatePacket: (id: string, updates: Partial<ApplicationPacket>) => void;
  addApplyRun: (r: ApplyRun) => void;
  addActivityLog: (l: ActivityLog) => void;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateConnector: (id: string, updates: Partial<SourceConnector>) => void;
  addRule: (r: AutomationRule) => void;
  updateRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  addReminder: (r: FollowUpReminder) => void;
  updateReminder: (id: string, updates: Partial<FollowUpReminder>) => void;
  // Gmail
  setEmailJobs: (jobs: EmailJob[]) => void;
  addEmailJobs: (jobs: EmailJob[]) => void;
  dismissEmailJob: (id: string) => void;
  markEmailJobSaved: (id: string) => void;
  setGmailState: (g: Partial<GmailSyncState>) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PersistedState>(loadState);

  // Persist on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Clear on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setState({
        masterResume: null, tailoredResumes: [], applications: [], documents: [],
        jobs: [], savedJobs: [], jobAnalyses: [], coverLetters: [], reviewQueue: [],
        automationSettings: null, packets: [], applyRuns: [], activityLogs: [],
        notifications: [], connectors: defaultConnectors, rules: [], reminders: [],
        emailJobs: [], gmail: { connected: false, lastSync: null },
      });
    }
  }, [isAuthenticated]);

  const update = useCallback((fn: (prev: PersistedState) => Partial<PersistedState>) => {
    setState(prev => ({ ...prev, ...fn(prev) }));
  }, []);

  // Phase 1
  const setMasterResume = useCallback((r: MasterResume) => update(() => ({ masterResume: r })), [update]);
  const addTailoredResume = useCallback((r: TailoredResume) => update(p => ({ tailoredResumes: [r, ...p.tailoredResumes] })), [update]);
  const addApplication = useCallback((a: Application) => update(p => ({ applications: [a, ...p.applications] })), [update]);
  const updateApplication = useCallback((id: string, updates: Partial<Application>) => {
    update(p => ({ applications: p.applications.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a) }));
  }, [update]);
  const deleteApplication = useCallback((id: string) => update(p => ({ applications: p.applications.filter(a => a.id !== id) })), [update]);
  const updateApplicationStatus = useCallback((id: string, status: ApplicationStatus) => {
    update(p => ({ applications: p.applications.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a) }));
  }, [update]);
  const addDocument = useCallback((d: AppDocument) => update(p => ({ documents: [d, ...p.documents] })), [update]);

  // Phase 2
  const addJob = useCallback((j: Job) => update(p => ({ jobs: [j, ...p.jobs.filter(x => x.id !== j.id)] })), [update]);
  const addJobs = useCallback((js: Job[]) => update(p => {
    const existingIds = new Set(p.jobs.map(j => j.id));
    const newJobs = js.filter(j => !existingIds.has(j.id));
    return { jobs: [...newJobs, ...p.jobs] };
  }), [update]);
  const removeJob = useCallback((id: string) => update(p => ({ jobs: p.jobs.filter(j => j.id !== id) })), [update]);
  const saveJob = useCallback((s: SavedJob) => update(p => ({ savedJobs: [s, ...p.savedJobs.filter(x => x.jobId !== s.jobId)] })), [update]);
  const updateSavedJob = useCallback((id: string, updates: Partial<SavedJob>) => {
    update(p => ({ savedJobs: p.savedJobs.map(s => s.id === id ? { ...s, ...updates } : s) }));
  }, [update]);
  const removeSavedJob = useCallback((id: string) => update(p => ({ savedJobs: p.savedJobs.filter(s => s.id !== id) })), [update]);
  const addJobAnalysis = useCallback((a: JobAnalysis) => update(p => ({ jobAnalyses: [a, ...p.jobAnalyses.filter(x => x.jobId !== a.jobId)] })), [update]);
  const addCoverLetter = useCallback((c: CoverLetter) => update(p => ({ coverLetters: [c, ...p.coverLetters] })), [update]);
  const updateCoverLetter = useCallback((id: string, updates: Partial<CoverLetter>) => {
    update(p => ({ coverLetters: p.coverLetters.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c) }));
  }, [update]);
  const deleteCoverLetter = useCallback((id: string) => update(p => ({ coverLetters: p.coverLetters.filter(c => c.id !== id) })), [update]);
  const addReviewItem = useCallback((r: ReviewQueueItem) => update(p => ({ reviewQueue: [r, ...p.reviewQueue] })), [update]);
  const updateReviewItem = useCallback((id: string, updates: Partial<ReviewQueueItem>) => {
    update(p => ({ reviewQueue: p.reviewQueue.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, [update]);

  // Phase 3
  const setAutomationSettings = useCallback((s: AutomationSettings) => update(() => ({ automationSettings: s })), [update]);
  const addPacket = useCallback((p: ApplicationPacket) => update(prev => ({ packets: [p, ...prev.packets] })), [update]);
  const updatePacket = useCallback((id: string, updates: Partial<ApplicationPacket>) => {
    update(p => ({ packets: p.packets.map(pk => pk.id === id ? { ...pk, ...updates, updatedAt: new Date().toISOString() } : pk) }));
  }, [update]);
  const addApplyRun = useCallback((r: ApplyRun) => update(p => ({ applyRuns: [r, ...p.applyRuns] })), [update]);
  const addActivityLog = useCallback((l: ActivityLog) => update(p => ({ activityLogs: [l, ...p.activityLogs] })), [update]);
  const addNotification = useCallback((n: AppNotification) => update(p => ({ notifications: [n, ...p.notifications] })), [update]);
  const markNotificationRead = useCallback((id: string) => {
    update(p => ({ notifications: p.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, [update]);
  const markAllNotificationsRead = useCallback(() => {
    update(p => ({ notifications: p.notifications.map(n => ({ ...n, read: true })) }));
  }, [update]);
  const updateConnector = useCallback((id: string, updates: Partial<SourceConnector>) => {
    update(p => ({ connectors: p.connectors.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, [update]);
  const addRule = useCallback((r: AutomationRule) => update(p => ({ rules: [...p.rules, r] })), [update]);
  const updateRule = useCallback((id: string, updates: Partial<AutomationRule>) => {
    update(p => ({ rules: p.rules.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, [update]);
  const deleteRule = useCallback((id: string) => update(p => ({ rules: p.rules.filter(r => r.id !== id) })), [update]);
  const addReminder = useCallback((r: FollowUpReminder) => update(p => ({ reminders: [...p.reminders, r] })), [update]);
  const updateReminder = useCallback((id: string, updates: Partial<FollowUpReminder>) => {
    update(p => ({ reminders: p.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, [update]);

  // Gmail
  const setEmailJobs = useCallback((jobs: EmailJob[]) => update(() => ({ emailJobs: jobs })), [update]);
  const addEmailJobs = useCallback((jobs: EmailJob[]) => update(p => {
    const existingIds = new Set(p.emailJobs.map(j => j.emailId));
    const fresh = jobs.filter(j => !existingIds.has(j.emailId));
    return { emailJobs: [...fresh, ...p.emailJobs] };
  }), [update]);
  const dismissEmailJob = useCallback((id: string) => {
    update(p => ({ emailJobs: p.emailJobs.map(j => j.id === id ? { ...j, dismissed: true } : j) }));
  }, [update]);
  const markEmailJobSaved = useCallback((id: string) => {
    update(p => ({ emailJobs: p.emailJobs.map(j => j.id === id ? { ...j, savedToTracker: true } : j) }));
  }, [update]);
  const setGmailState = useCallback((g: Partial<GmailSyncState>) => {
    update(p => ({ gmail: { ...p.gmail, ...g } }));
  }, [update]);

  return (
    <AppContext.Provider value={{
      ...state,
      templates: resumeTemplates,
      setMasterResume, addTailoredResume, addApplication, updateApplication,
      deleteApplication, updateApplicationStatus, addDocument,
      addJob, addJobs, removeJob, saveJob, updateSavedJob, removeSavedJob,
      addJobAnalysis, addCoverLetter, updateCoverLetter, deleteCoverLetter,
      addReviewItem, updateReviewItem,
      setAutomationSettings, addPacket, updatePacket, addApplyRun,
      addActivityLog, addNotification, markNotificationRead, markAllNotificationsRead,
      updateConnector, addRule, updateRule, deleteRule, addReminder, updateReminder,
      setEmailJobs, addEmailJobs, dismissEmailJob, markEmailJobSaved, setGmailState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
