import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkPreference } from '@/types';

export default function Settings() {
  const { profile, preferences, updateProfile, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [linkedIn, setLinkedIn] = useState(profile?.linkedIn || '');
  const [website, setWebsite] = useState(profile?.website || '');

  const [prefLocation, setPrefLocation] = useState(preferences?.location || '');
  const [workPref, setWorkPref] = useState<WorkPreference>(preferences?.workPreference || 'hybrid');
  const [yoe, setYoe] = useState(preferences?.yearsOfExperience || 0);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    updateProfile({ fullName, phone, location, linkedIn, website });
    toast.success('Profile updated');
    setSaving(false);
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    updatePreferences({ location: prefLocation, workPreference: workPref, yearsOfExperience: yoe });
    toast.success('Preferences updated');
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={profile?.email || ''} disabled className="opacity-60" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedIn} onChange={e => setLinkedIn(e.target.value)} /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} /></div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Job Preferences</CardTitle>
            <CardDescription>Your target search criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Preferred Location</Label><Input value={prefLocation} onChange={e => setPrefLocation(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Preference</Label>
                <Select value={workPref} onValueChange={v => setWorkPref(v as WorkPreference)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Years of Experience</Label><Input type="number" value={yoe} onChange={e => setYoe(parseInt(e.target.value) || 0)} /></div>
            </div>

            {preferences?.targetJobTitles && preferences.targetJobTitles.length > 0 && (
              <div className="space-y-2">
                <Label>Target Job Titles</Label>
                <div className="flex flex-wrap gap-1.5">{preferences.targetJobTitles.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
              </div>
            )}

            {preferences?.preferredIndustries && preferences.preferredIndustries.length > 0 && (
              <div className="space-y-2">
                <Label>Preferred Industries</Label>
                <div className="flex flex-wrap gap-1.5">{preferences.preferredIndustries.map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div>
              </div>
            )}

            <Button onClick={handleSavePrefs} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
