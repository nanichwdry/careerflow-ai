import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { MasterResume, TailoredResume, Application, AppDocument, ResumeTemplate, ApplicationStatus } from '@/types';
import { seedMasterResume, seedTemplates, seedTailoredResumes, seedApplications, seedDocuments } from '@/data/seed';
import { useAuth } from './AuthContext';

interface AppState {
  masterResume: MasterResume | null;
  tailoredResumes: TailoredResume[];
  applications: Application[];
  documents: AppDocument[];
  templates: ResumeTemplate[];
  setMasterResume: (r: MasterResume) => void;
  addTailoredResume: (r: TailoredResume) => void;
  addApplication: (a: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  addDocument: (d: AppDocument) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useAuth();

  const [masterResume, setMasterResumeState] = useState<MasterResume | null>(() => {
    const saved = localStorage.getItem('cf_app_data');
    if (saved) {
      const data = JSON.parse(saved);
      return data.masterResume || null;
    }
    return null;
  });

  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>(() => {
    const saved = localStorage.getItem('cf_app_data');
    if (saved) return JSON.parse(saved).tailoredResumes || [];
    return [];
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem('cf_app_data');
    if (saved) return JSON.parse(saved).applications || [];
    return [];
  });

  const [documents, setDocuments] = useState<AppDocument[]>(() => {
    const saved = localStorage.getItem('cf_app_data');
    if (saved) return JSON.parse(saved).documents || [];
    return [];
  });

  const templates = seedTemplates;

  // Load seed data when user is authenticated and onboarded
  useEffect(() => {
    if (isAuthenticated && isOnboarded && !masterResume) {
      setMasterResumeState(seedMasterResume);
      setTailoredResumes(seedTailoredResumes);
      setApplications(seedApplications);
      setDocuments(seedDocuments);
    }
  }, [isAuthenticated, isOnboarded, masterResume]);

  // Persist to localStorage
  useEffect(() => {
    if (masterResume || tailoredResumes.length || applications.length || documents.length) {
      localStorage.setItem('cf_app_data', JSON.stringify({ masterResume, tailoredResumes, applications, documents }));
    }
  }, [masterResume, tailoredResumes, applications, documents]);

  const setMasterResume = useCallback((r: MasterResume) => {
    setMasterResumeState(r);
  }, []);

  const addTailoredResume = useCallback((r: TailoredResume) => {
    setTailoredResumes(prev => [r, ...prev]);
  }, []);

  const addApplication = useCallback((a: Application) => {
    setApplications(prev => [a, ...prev]);
  }, []);

  const updateApplication = useCallback((id: string, updates: Partial<Application>) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
  }, []);

  const deleteApplication = useCallback((id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateApplicationStatus = useCallback((id: string, status: ApplicationStatus) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a));
  }, []);

  const addDocument = useCallback((d: AppDocument) => {
    setDocuments(prev => [d, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      masterResume, tailoredResumes, applications, documents, templates,
      setMasterResume, addTailoredResume, addApplication, updateApplication,
      deleteApplication, updateApplicationStatus, addDocument,
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
