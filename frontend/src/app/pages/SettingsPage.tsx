import { useState, useEffect } from 'react';
import { useDiary, DiaryEntry } from '../contexts/DiaryContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Moon, Sun, Download, User, Lock, Save, Keyboard, FileText, FileJson, FileType } from 'lucide-react';
import { useTheme } from 'next-themes';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export function SettingsPage() {
  const { user, updateProfile, updatePassword, entries, shortcuts, updateShortcut, resetShortcuts } = useDiary();
  const { theme, setTheme } = useTheme();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Export state
  const [exportFormat, setExportFormat] = useState<'json' | 'doc' | 'pdf'>('json');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus('saving');
    const success = await updateProfile(name, email);
    setProfileStatus(success ? 'success' : 'error');
    setTimeout(() => setProfileStatus('idle'), 3000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error');
      return;
    }
    setPasswordStatus('saving');
    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
      setPasswordStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus('error');
    }
    setTimeout(() => setPasswordStatus('idle'), 3000);
  };

  const handleExport = async () => {
    setExportStatus('exporting');
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `diary_export_${timestamp}`;

        if (exportFormat === 'json') {
            const dataStr = JSON.stringify(entries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            saveAs(blob, `${filename}.json`);
        } else if (exportFormat === 'pdf') {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('My Diary Export', 20, 20);
            
            doc.setFontSize(12);
            let y = 40;
            
            entries.forEach((entry, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFont('helvetica', 'bold');
                doc.text(`${entry.title} (${new Date(entry.date).toLocaleDateString()})`, 20, y);
                y += 10;
                
                doc.setFont('helvetica', 'normal');
                const splitContent = doc.splitTextToSize(entry.content, 170);
                doc.text(splitContent, 20, y);
                y += (splitContent.length * 7) + 15;
            });
            
            doc.save(`${filename}.pdf`);
        } else if (exportFormat === 'doc') {
            // Simple HTML export for "doc" mode as it's lightweight and widely compatible
            // Or use docx library if user strictly wants .docx
            // User said "doc mode", often implies Word. Let's use 'docx' library for better result.
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "My Diary Export",
                                    bold: true,
                                    size: 48,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),
                        ...entries.flatMap(entry => [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: entry.title,
                                        bold: true,
                                        size: 32,
                                    }),
                                    new TextRun({
                                        text: `  (${new Date(entry.date).toLocaleDateString()})`,
                                        size: 24,
                                        color: "666666",
                                    }),
                                ],
                                spacing: { before: 400, after: 200 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: entry.content,
                                        size: 24,
                                    }),
                                ],
                                spacing: { after: 200 },
                            }),
                            new Paragraph({
                                text: "--------------------------------------------------",
                                spacing: { after: 200 },
                            })
                        ]),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${filename}.docx`);
        }
        
        setExportStatus('success');
    } catch (error) {
        console.error('Export failed:', error);
        setExportStatus('error');
    }
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-slate-800 dark:text-slate-100 mb-8">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="data">Data & Export</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            {/* ... (existing profile code) ... */}
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={profileStatus === 'saving'}>
                      {profileStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {profileStatus === 'success' && <p className="text-green-600 text-sm">Profile updated!</p>}
                    {profileStatus === 'error' && <p className="text-red-600 text-sm">Update failed.</p>}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={passwordStatus === 'saving'}>
                      {passwordStatus === 'saving' ? 'Updating...' : 'Update Password'}
                    </Button>
                    {passwordStatus === 'success' && <p className="text-green-600 text-sm">Password updated!</p>}
                    {passwordStatus === 'error' && <p className="text-red-600 text-sm">Update failed. Check current password.</p>}
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
             {/* ... (existing appearance code) ... */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize how the application looks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span>Dark Mode</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shortcuts Settings */}
          <TabsContent value="shortcuts">
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Shortcuts</CardTitle>
                <CardDescription>Customize your keyboard shortcuts for writing.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <Label>Save Entry</Label>
                            <p className="text-xs text-slate-500">Save current changes without leaving</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Cmd/Ctrl + </span>
                            <Input 
                                className="w-16 h-8 text-center uppercase" 
                                value={shortcuts.save}
                                onChange={(e) => updateShortcut('save', e.target.value.slice(0, 1))}
                                maxLength={1}
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <Label>Save & Exit</Label>
                            <p className="text-xs text-slate-500">Save and return to timeline</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Cmd/Ctrl + </span>
                            <Input 
                                className="w-24 h-8 text-center" 
                                value={shortcuts.saveAndExit}
                                onChange={(e) => updateShortcut('saveAndExit', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <Label>Bold Text</Label>
                            <p className="text-xs text-slate-500">Apply bold formatting to selection</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Cmd/Ctrl + </span>
                            <Input 
                                className="w-16 h-8 text-center uppercase" 
                                value={shortcuts.bold}
                                onChange={(e) => updateShortcut('bold', e.target.value.slice(0, 1))}
                                maxLength={1}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <Label>Italic Text</Label>
                            <p className="text-xs text-slate-500">Apply italic formatting to selection</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Cmd/Ctrl + </span>
                            <Input 
                                className="w-16 h-8 text-center uppercase" 
                                value={shortcuts.italic}
                                onChange={(e) => updateShortcut('italic', e.target.value.slice(0, 1))}
                                maxLength={1}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="outline" size="sm" onClick={resetShortcuts} className="text-slate-500">
                            Reset to Defaults
                        </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download your diary entries in various formats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div 
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${exportFormat === 'json' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}
                        onClick={() => setExportFormat('json')}
                    >
                        <FileJson className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">JSON</span>
                    </div>
                    <div 
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${exportFormat === 'doc' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}
                        onClick={() => setExportFormat('doc')}
                    >
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Word (DOCX)</span>
                    </div>
                    <div 
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${exportFormat === 'pdf' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}
                        onClick={() => setExportFormat('pdf')}
                    >
                        <FileType className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">PDF</span>
                    </div>
                </div>

                <Button 
                    onClick={handleExport} 
                    className="w-full gap-2" 
                    disabled={exportStatus === 'exporting'}
                >
                  <Download className="w-4 h-4" />
                  {exportStatus === 'exporting' ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                </Button>
                
                {exportStatus === 'success' && (
                    <p className="text-sm text-green-600 text-center">Export completed successfully!</p>
                )}
                {exportStatus === 'error' && (
                    <p className="text-sm text-red-600 text-center">Export failed. Please try again.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
