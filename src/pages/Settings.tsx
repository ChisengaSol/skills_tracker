import { useState, useEffect, useContext } from 'react';
import { Moon, Bell, Globe, Download, Trash2, Plus, Minus, Clock, Save } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import '../styles/settings.css';

interface UserSettings {
  weekly_target: number;
  language: string;
  streak_reminder: boolean;
  goal_due: boolean;
  weekly_report: boolean;
  reminder_time: string;
  dark_mode: boolean;
}

function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    weekly_target: 10,
    language: 'English',
    streak_reminder: true,
    goal_due: true,
    weekly_report: false,
    reminder_time: '20:00',
    dark_mode: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Settings must be used within AuthContextProvider');
  const { session } = auth;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  useEffect(() => {
    if (!session) return;
    fetchSettings();
  }, [session]);

  async function fetchSettings() {
    if (!session) return;

    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) setSettings(data);
  }

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function saveSettings() {
    if (!session) return;
    setLoading(true);

    const { error } = await supabase
      .from('settings')
      .upsert({
        id: session.user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    setLoading(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Apply dark mode to document
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  async function handleExport() {
    if (!session) return;
    setExportLoading(true);

    // Fetch all user data
    const [
      { data: skills },
      { data: categories },
      { data: goals },
      { data: logs },
      { data: milestones },
      { data: profile },
    ] = await Promise.all([
      supabase.from('skills').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('learning_logs').select('*'),
      supabase.from('milestones').select('*'),
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: { email: session.user.email, ...profile },
      skills,
      categories,
      goals,
      learning_logs: logs,
      milestones,
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skilltrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportLoading(false);
  }

  async function handleDeleteAccount() {
    if (!session) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);

    // Delete all user data — RLS cascade handles most,
    // but we explicitly delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(session.user.id);

    if (error) {
      // admin.deleteUser requires service role key — use RPC instead
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        alert('Could not delete account. Please contact support.');
        setDeleteLoading(false);
        setDeleteConfirm(false);
        return;
      }
    }

    await supabase.auth.signOut();
    window.location.href = '/register';
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>{today}</p>
        </div>
        <button
          className="save-settings-btn"
          onClick={saveSettings}
          disabled={loading}
        >
          <Save size={16} />
          {saved ? 'Saved!' : loading ? 'Saving...' : 'Save changes'}
        </button>
      </header>

      {/* ── Appearance ── */}
      <div className="settings-section">
        <h2 className="section-title">Appearance</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon"><Moon size={20} /></div>
              <div className="row-text">
                <h3>Dark mode</h3>
                <p>Switch to a darker interface</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.dark_mode}
                onChange={() => updateSetting('dark_mode', !settings.dark_mode)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Learning ── */}
      <div className="settings-section">
        <h2 className="section-title">Learning</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="row-info">
              <div className="row-text">
                <h3>Weekly hour target</h3>
                <p>Hours you aim to study per week</p>
              </div>
            </div>
            <div className="stepper-control">
              <button
                className="stepper-btn"
                onClick={() => updateSetting('weekly_target', Math.max(1, settings.weekly_target - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="stepper-value">{settings.weekly_target}h</span>
              <button
                className="stepper-btn"
                onClick={() => updateSetting('weekly_target', settings.weekly_target + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="row-info">
              <div className="row-text">
                <h3>Interface language</h3>
                <p>Language used across the app</p>
              </div>
            </div>
            <div className="select-control">
              <Globe size={16} color="#6b7280" />
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="settings-section">
        <h2 className="section-title">Notifications</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon"><Bell size={20} /></div>
              <div className="row-text">
                <h3>Streak reminder</h3>
                <p>Get notified if you haven't studied today</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.streak_reminder}
                onChange={() => updateSetting('streak_reminder', !settings.streak_reminder)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon"><Bell size={20} /></div>
              <div className="row-text">
                <h3>Goal due soon</h3>
                <p>Reminder 2 days before a goal deadline</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.goal_due}
                onChange={() => updateSetting('goal_due', !settings.goal_due)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon"><Bell size={20} /></div>
              <div className="row-text">
                <h3>Weekly report</h3>
                <p>Summary of your learning every Monday</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.weekly_report}
                onChange={() => updateSetting('weekly_report', !settings.weekly_report)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-row">
            <div className="row-info">
              <div className="row-text">
                <h3>Reminder time</h3>
                <p>When to send daily reminders</p>
              </div>
            </div>
            <div className="time-control">
              <input
                type="time"
                value={settings.reminder_time}
                onChange={(e) => updateSetting('reminder_time', e.target.value)}
              />
              <Clock size={16} color="#6b7280" />
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <h2 className="section-title">Data</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon"><Download size={20} /></div>
              <div className="row-text">
                <h3>Export data</h3>
                <p>Download all your skills and logs as JSON</p>
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>

          <div className="settings-row">
            <div className="row-info">
              <div className="row-icon danger-icon"><Trash2 size={20} /></div>
              <div className="row-text danger-text">
                <h3>Delete account</h3>
                <p>
                  {deleteConfirm
                    ? 'Are you sure? This cannot be undone. Click again to confirm.'
                    : 'Permanently remove all your data'}
                </p>
              </div>
            </div>
            <button
              className={deleteConfirm ? 'btn-danger-confirm' : 'btn-danger'}
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : deleteConfirm ? 'Confirm' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="version-text">SkillTrack v1.0.0</div>
    </div>
  );
}

export default Settings;