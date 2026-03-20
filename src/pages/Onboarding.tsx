import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import type { WorkPreference } from '@/types';

const STEPS = ['Job Preferences', 'Experience & Skills', 'Salary & Logistics', 'Exclusions'];

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [targetJobTitles, setTargetJobTitles] = useState<string[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [location, setLocation] = useState('');
  const [workPreference, setWorkPreference] = useState<WorkPreference>('hybrid');
  const [yearsOfExperience, setYearsOfExperience] = useState(5);
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();
  const [visaSponsorship, setVisaSponsorship] = useState(false);
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [exCompanyInput, setExCompanyInput] = useState('');
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [exKeywordInput, setExKeywordInput] = useState('');

  const addTag = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, input: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    const tags = input.split(/[,;]+/).map(s => s.trim()).filter(s => s && !list.includes(s));
    if (tags.length > 0) {
      setList([...list, ...tags]);
      setInput('');
    }
  };

  const removeTag = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const TagInput = ({ label, list, setList, input, setInput, placeholder }: { label: string; list: string[]; setList: React.Dispatch<React.SetStateAction<string[]>>; input: string; setInput: React.Dispatch<React.SetStateAction<string>>; placeholder: string }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Auto-add when user types a comma or semicolon
      if (val.includes(',') || val.includes(';')) {
        addTag(list, setList, val, setInput);
      } else {
        setInput(val);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        addTag(list, setList, input, setInput);
      }
      if (e.key === 'Backspace' && !input && list.length > 0) {
        setList(list.slice(0, -1));
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap items-center gap-1.5 p-2 border rounded-md border-input bg-background min-h-[40px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
          {list.map(item => (
            <Badge key={item} variant="secondary" className="cursor-pointer hover:bg-destructive/20 shrink-0" onClick={() => removeTag(list, setList, item)}>
              {item} ×
            </Badge>
          ))}
          <input
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input.trim()) addTag(list, setList, input, setInput); }}
            placeholder={list.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">Type and press Enter, Tab, or comma to add</p>
      </div>
    );
  };

  const handleFinish = () => {
    completeOnboarding({
      targetJobTitles, keywords, location, workPreference, yearsOfExperience,
      preferredIndustries: industries, salaryMin, salaryMax,
      visaSponsorshipNeeded: visaSponsorship, excludedCompanies, excludedKeywords,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Set Up Your Preferences</h1>
          </div>
          <p className="text-muted-foreground">Help us tailor your experience. You can update these anytime.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              <span className={`text-xs mt-1 ${i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s}</span>
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
            <CardDescription>Step {step + 1} of {STEPS.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 0 && (
              <>
                <TagInput label="Target Job Titles" list={targetJobTitles} setList={setTargetJobTitles} input={titleInput} setInput={setTitleInput} placeholder="e.g., Senior Software Engineer" />
                <TagInput label="Keywords" list={keywords} setList={setKeywords} input={keywordInput} setInput={setKeywordInput} placeholder="e.g., React, distributed systems" />
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., San Francisco Bay Area" />
                </div>
                <div className="space-y-2">
                  <Label>Work Preference</Label>
                  <Select value={workPreference} onValueChange={v => setWorkPreference(v as WorkPreference)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input type="number" min={0} max={40} value={yearsOfExperience} onChange={e => setYearsOfExperience(parseInt(e.target.value) || 0)} />
                </div>
                <TagInput label="Preferred Industries" list={industries} setList={setIndustries} input={industryInput} setInput={setIndustryInput} placeholder="e.g., FinTech, SaaS" />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Salary ($)</Label>
                    <Input type="number" value={salaryMin || ''} onChange={e => setSalaryMin(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="120000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Salary ($)</Label>
                    <Input type="number" value={salaryMax || ''} onChange={e => setSalaryMax(e.target.value ? parseInt(e.target.value) : undefined)} placeholder="200000" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="visa" checked={visaSponsorship} onCheckedChange={c => setVisaSponsorship(!!c)} />
                  <Label htmlFor="visa">I need visa sponsorship</Label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <TagInput label="Excluded Companies" list={excludedCompanies} setList={setExcludedCompanies} input={exCompanyInput} setInput={setExCompanyInput} placeholder="e.g., Company to avoid" />
                <TagInput label="Excluded Keywords" list={excludedKeywords} setList={setExcludedKeywords} input={exKeywordInput} setInput={setExKeywordInput} placeholder="e.g., blockchain, web3" />
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish}>
                  <Check className="h-4 w-4 mr-1" /> Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
