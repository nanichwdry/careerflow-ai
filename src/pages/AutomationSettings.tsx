import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Zap, Shield, Bell, Plug, Scale, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_AUTOMATION_SETTINGS, type AutomationSettings, type AutomationRule } from '@/types/automation';

export default function AutomationSettingsPage() {
  const { automationSettings, setAutomationSettings, connectors, updateConnector, rules, addRule, updateRule, deleteRule } = useApp();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutomationSettings>(
    automationSettings || { ...DEFAULT_AUTOMATION_SETTINGS, userId: user?.id || '' }
  );
  const [ruleOpen, setRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', field: 'fitScore', operator: 'gt' as AutomationRule['condition']['operator'], value: '75', action: 'auto_prepare' as AutomationRule['action'] });

  useEffect(() => {
    if (automationSettings) setSettings(automationSettings);
  }, [automationSettings]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setAutomationSettings({ ...settings, userId: user?.id || '' });
    toast.success('Settings saved');
    setSaving(false);
  };

  const handleAddRule = () => {
    if (!newRule.name.trim()) { toast.error('Rule name required'); return; }
    addRule({
      id: crypto.randomUUID(), userId: user?.id || '', name: newRule.name.trim(), enabled: true,
      condition: { field: newRule.field, operator: newRule.operator, value: isNaN(Number(newRule.value)) ? newRule.value : Number(newRule.value) },
      action: newRule.action, priority: rules.length + 1,
    });
    toast.success('Rule added');
    setRuleOpen(false);
    setNewRule({ name: '', field: 'fitScore', operator: 'gt', value: '75', action: 'auto_prepare' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automation Settings</h1>
          <p className="text-muted-foreground mt-1">Configure apply workflows, rules, and connectors</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general"><Settings2 className="h-4 w-4 mr-1" /> General</TabsTrigger>
            <TabsTrigger value="rules"><Scale className="h-4 w-4 mr-1" /> Rules</TabsTrigger>
            <TabsTrigger value="connectors"><Plug className="h-4 w-4 mr-1" /> Connectors</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automation</CardTitle>
                <CardDescription>Control how applications are prepared and submitted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Auto-Apply</Label><p className="text-xs text-muted-foreground">Automatically prepare and submit applications</p></div>
                  <Switch checked={settings.autoApplyEnabled} onCheckedChange={v => setSettings(s => ({ ...s, autoApplyEnabled: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Assisted Apply Only</Label><p className="text-xs text-muted-foreground">Require manual confirmation before submission</p></div>
                  <Switch checked={settings.assistedApplyOnly} onCheckedChange={v => setSettings(s => ({ ...s, assistedApplyOnly: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Easy Apply Only</Label><p className="text-xs text-muted-foreground">Only process jobs with easy apply</p></div>
                  <Switch checked={settings.easyApplyOnly} onCheckedChange={v => setSettings(s => ({ ...s, easyApplyOnly: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Cover Letter Generation</Label><p className="text-xs text-muted-foreground">Auto-generate cover letters for applications</p></div>
                  <Switch checked={settings.coverLetterEnabled} onCheckedChange={v => setSettings(s => ({ ...s, coverLetterEnabled: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Duplicate Detection</Label><p className="text-xs text-muted-foreground">Warn before applying to same company/role</p></div>
                  <Switch checked={settings.duplicateDetection} onCheckedChange={v => setSettings(s => ({ ...s, duplicateDetection: v }))} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Match Threshold (%)</Label><Input type="number" min={0} max={100} value={settings.matchThreshold} onChange={e => setSettings(s => ({ ...s, matchThreshold: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="space-y-2"><Label>Min Salary ($)</Label><Input type="number" value={settings.minSalary} onChange={e => setSettings(s => ({ ...s, minSalary: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="space-y-2"><Label>Max Apps/Day</Label><Input type="number" min={1} max={50} value={settings.maxAppsPerDay} onChange={e => setSettings(s => ({ ...s, maxAppsPerDay: parseInt(e.target.value) || 1 }))} /></div>
                  <div className="space-y-2"><Label>Max Apps/Source</Label><Input type="number" min={1} max={20} value={settings.maxAppsPerSource} onChange={e => setSettings(s => ({ ...s, maxAppsPerSource: parseInt(e.target.value) || 1 }))} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Resume Style</Label>
                  <Select value={settings.resumeStyle} onValueChange={v => setSettings(s => ({ ...s, resumeStyle: v as AutomationSettings['resumeStyle'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal ATS</SelectItem>
                      <SelectItem value="modern">Modern Professional</SelectItem>
                      <SelectItem value="executive">Executive Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardContent className="pt-6 flex items-start gap-3 text-sm">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Compliance Notice</p>
                  <p className="text-muted-foreground mt-1">All automation is compliant and user-authorized. No CAPTCHA bypass, anti-bot evasion, or portal TOS violations. Unsupported flows are routed to the review queue.</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Settings
            </Button>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Define rules for automatic job/application decisions</p>
              <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Automation Rule</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2"><Label>Name</Label><Input value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="e.g., Skip low fit" /></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label>Field</Label>
                        <Select value={newRule.field} onValueChange={v => setNewRule(r => ({ ...r, field: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fitScore">Fit Score</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="workArrangement">Work Type</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="easyApply">Easy Apply</SelectItem>
                            <SelectItem value="visaSponsorship">Visa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select value={newRule.operator} onValueChange={v => setNewRule(r => ({ ...r, operator: v as AutomationRule['condition']['operator'] }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gt">&gt;</SelectItem><SelectItem value="lt">&lt;</SelectItem>
                            <SelectItem value="eq">=</SelectItem><SelectItem value="neq">≠</SelectItem>
                            <SelectItem value="contains">contains</SelectItem><SelectItem value="not_contains">excludes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Value</Label><Input value={newRule.value} onChange={e => setNewRule(r => ({ ...r, value: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={newRule.action} onValueChange={v => setNewRule(r => ({ ...r, action: v as AutomationRule['action'] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto_prepare">Auto Prepare</SelectItem>
                          <SelectItem value="skip">Skip</SelectItem>
                          <SelectItem value="review">Send to Review</SelectItem>
                          <SelectItem value="prioritize">Prioritize</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddRule}>Add Rule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {rules.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="py-12 text-center">
                  <Scale className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">No rules configured</p>
                  <p className="text-sm text-muted-foreground mt-1">Add rules to automate job evaluation decisions.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {rules.map(rule => (
                  <Card key={rule.id} className="border-border/50">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch checked={rule.enabled} onCheckedChange={v => updateRule(rule.id, { enabled: v })} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            If {rule.condition.field} {rule.condition.operator} {String(rule.condition.value)} → {rule.action.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { deleteRule(rule.id); toast.success('Rule deleted'); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="connectors" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Manage job source connectors. Enable connectors when API credentials are configured.</p>
            {connectors.map(c => (
              <Card key={c.id} className="border-border/50">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : c.status === 'error' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{c.type}</Badge>
                        {c.capabilities.map(cap => <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>)}
                      </div>
                      {c.limitations.length > 0 && <p className="text-xs text-muted-foreground mt-1">{c.limitations[0]}</p>}
                    </div>
                  </div>
                  <Switch checked={c.enabled} onCheckedChange={v => updateConnector(c.id, { enabled: v, status: v ? 'active' : 'inactive' })} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'notifyOnMatch', label: 'New matching jobs', desc: 'When a job matches your criteria' },
                  { key: 'notifyOnSubmit', label: 'Application submitted', desc: 'When an application is successfully submitted' },
                  { key: 'notifyOnFail', label: 'Application failed', desc: 'When an application submission fails' },
                  { key: 'notifyOnReview', label: 'Review needed', desc: 'When a job is sent to review queue' },
                  { key: 'notifyFollowUp', label: 'Follow-up reminders', desc: 'Reminders to follow up on applications' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div><Label>{item.label}</Label><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    <Switch
                      checked={(settings as Record<string, unknown>)[item.key] as boolean}
                      onCheckedChange={v => setSettings(s => ({ ...s, [item.key]: v }))}
                    />
                  </div>
                ))}
                <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
