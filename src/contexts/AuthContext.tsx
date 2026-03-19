import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserProfile, Preferences } from '@/types';
import { seedProfile, seedPreferences } from '@/data/seed';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  preferences: Preferences | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<Preferences>) => void;
  completeOnboarding: (prefs: Omit<Preferences, 'userId'>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cf_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [preferences, setPreferences] = useState<Preferences | null>(() => {
    const saved = localStorage.getItem('cf_preferences');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('cf_user', JSON.stringify(user));
    else localStorage.removeItem('cf_user');
  }, [user]);

  useEffect(() => {
    if (profile) localStorage.setItem('cf_profile', JSON.stringify(profile));
    else localStorage.removeItem('cf_profile');
  }, [profile]);

  useEffect(() => {
    if (preferences) localStorage.setItem('cf_preferences', JSON.stringify(preferences));
    else localStorage.removeItem('cf_preferences');
  }, [preferences]);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const u: User = { id: 'demo-user-001', email, name: email.split('@')[0], createdAt: new Date().toISOString() };
    setUser(u);
    // Load demo data for demo account
    setProfile(seedProfile);
    setPreferences(seedPreferences);
    setIsLoading(false);
  }, []);

  const signup = useCallback(async (email: string, _password: string, name: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const id = crypto.randomUUID();
    const u: User = { id, email, name, createdAt: new Date().toISOString() };
    setUser(u);
    setProfile({ userId: id, fullName: name, email, onboardingCompleted: false });
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setProfile(null);
    setPreferences(null);
    localStorage.removeItem('cf_user');
    localStorage.removeItem('cf_profile');
    localStorage.removeItem('cf_preferences');
    localStorage.removeItem('cf_app_data');
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(p => p ? { ...p, ...updates } : null);
  }, []);

  const updatePreferences = useCallback((updates: Partial<Preferences>) => {
    setPreferences(p => p ? { ...p, ...updates } : null);
  }, []);

  const completeOnboarding = useCallback((prefs: Omit<Preferences, 'userId'>) => {
    if (!user) return;
    setPreferences({ ...prefs, userId: user.id });
    setProfile(p => p ? { ...p, onboardingCompleted: true } : null);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, profile, preferences,
      isAuthenticated: !!user,
      isOnboarded: profile?.onboardingCompleted ?? false,
      isLoading,
      login, signup, logout,
      updateProfile, updatePreferences, completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
