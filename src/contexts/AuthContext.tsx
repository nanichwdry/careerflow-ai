import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserProfile, Preferences } from '@/types';

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
    try { const s = localStorage.getItem('cf_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try { const s = localStorage.getItem('cf_profile'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [preferences, setPreferences] = useState<Preferences | null>(() => {
    try { const s = localStorage.getItem('cf_preferences'); return s ? JSON.parse(s) : null; } catch { return null; }
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

  // In production, replace with real API auth calls
  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const u: User = { id: crypto.randomUUID(), email, name: email.split('@')[0], createdAt: new Date().toISOString() };
    setUser(u);
    // Check if profile already exists in storage (returning user)
    const existingProfile = localStorage.getItem('cf_profile');
    if (existingProfile) {
      setProfile(JSON.parse(existingProfile));
      const existingPrefs = localStorage.getItem('cf_preferences');
      if (existingPrefs) setPreferences(JSON.parse(existingPrefs));
    } else {
      setProfile({ userId: u.id, fullName: u.name, email, onboardingCompleted: false });
    }
    setIsLoading(false);
  }, []);

  const signup = useCallback(async (email: string, _password: string, name: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const id = crypto.randomUUID();
    setUser({ id, email, name, createdAt: new Date().toISOString() });
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
