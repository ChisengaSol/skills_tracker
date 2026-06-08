import { useState, useEffect, useContext } from 'react';
import { Pencil, Circle, Clock } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import '../styles/profile.css';

interface Profile {
  full_name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
}

interface ActivityLog {
  id: string;
  note: string | null;
  duration_minutes: number;
  logged_at: string;
  skills: { name: string; color: string } | null;
}

interface CategoryCoverage {
  name: string;
  avgProgress: number;
}

// Radar helpers
function buildRadarPoints(categoryNames: string[]) {
  const count = categoryNames.length;
  if (count === 0) return [];
  const cx = 50, cy = 50, radius = 40;

  return categoryNames.map((name, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    const deg = ((angle * 180) / Math.PI + 90 + 360) % 360;
    let labelClass = 'top';
    if (deg > 30 && deg <= 90) labelClass = 'right';
    else if (deg > 90 && deg <= 150) labelClass = 'bottom-right';
    else if (deg > 150 && deg <= 210) labelClass = 'bottom-left';
    else if (deg > 210 && deg <= 270) labelClass = 'left';

    return {
      label: name,
      cx: parseFloat(x.toFixed(2)),
      cy: parseFloat(y.toFixed(2)),
      labelClass,
    };
  });
}

function progressToPoint(
  tipX: number, tipY: number, progress: number
): { x: number; y: number } {
  const cx = 50, cy = 50;
  const t = progress / 100;
  return {
    x: cx + (tipX - cx) * t,
    y: cy + (tipY - cy) * t,
  };
}

function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '', title: '', bio: '', avatar_url: null,
  });
  const [totalHours, setTotalHours] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [categoryCoverage, setCategoryCoverage] = useState<CategoryCoverage[]>([]);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState<Set<string>>(new Set());

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Profile must be used within AuthContextProvider');
  const { session } = auth;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  async function fetchProfile() {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, title, bio, avatar_url')
      .eq('id', session.user.id)
      .single();
    if (data) setProfile(data);
    const createdAt = new Date(session.user.created_at);
    setMemberSince(createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  async function fetchStats() {
    if (!session) return;

    const { data: logs } = await supabase
      .from('learning_logs')
      .select('duration_minutes, logged_at')
      .order('logged_at', { ascending: false });

    const total = logs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
    const hours = parseFloat((total / 60).toFixed(1));
    setTotalHours(hours);

    let currentStreak = 0;
    if (logs && logs.length > 0) {
      const uniqueDates = [...new Set(
        logs.map(l => new Date(l.logged_at).toISOString().split('T')[0])
      )].sort((a, b) => b.localeCompare(a));

      let current = new Date(new Date().toISOString().split('T')[0]);
      for (const date of uniqueDates) {
        if (date === current.toISOString().split('T')[0]) {
          currentStreak++;
          current.setDate(current.getDate() - 1);
        } else break;
      }
    }
    setStreak(currentStreak);

    const { count } = await supabase
      .from('skills')
      .select('id', { count: 'exact', head: true });
    const sc = count || 0;
    setSkillsCount(sc);

    await awardBadges({ streak: currentStreak, totalHours: hours, skillsCount: sc });
  }

  async function awardBadges(stats: { streak: number; totalHours: number; skillsCount: number }) {
    if (!session) return;

    const { data: existing } = await supabase
      .from('earned_badges')
      .select('badge_key')
      .eq('user_id', session.user.id);

    const alreadyEarned = new Set(existing?.map(b => b.badge_key) || []);

    const toInsert: { user_id: string; badge_key: string }[] = [];
    for (const badge of BADGE_DEFINITIONS) {
      if (!alreadyEarned.has(badge.key) && badge.check(stats)) {
        toInsert.push({ user_id: session.user.id, badge_key: badge.key });
        alreadyEarned.add(badge.key);
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('earned_badges').insert(toInsert);
    }

    setEarnedBadgeKeys(alreadyEarned);
  }

  async function fetchCategoryCoverage() {
    if (!session) return;

    const { data: skills } = await supabase
      .from('skills')
      .select('id, target_hours, categories(name)');

    if (!skills || skills.length === 0) return;

    const skillsWithProgress = await Promise.all(
      skills.map(async (skill) => {
        const { data: logs } = await supabase
          .from('learning_logs')
          .select('duration_minutes')
          .eq('skill_id', skill.id);

        const totalMin = logs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
        const progress = Math.min(
          Math.round((totalMin / 60 / (skill.target_hours || 1)) * 100),
          100
        );
        return {
          category: (skill.categories as any)?.name || 'Other',
          progress,
        };
      })
    );

    const grouped: Record<string, number[]> = {};
    for (const s of skillsWithProgress) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s.progress);
    }

    const coverage: CategoryCoverage[] = Object.entries(grouped).map(([name, values]) => ({
      name,
      avgProgress: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }));

    setCategoryCoverage(coverage);
  }

  async function fetchRecentActivity() {
    if (!session) return;
    const { data } = await supabase
      .from('learning_logs')
      .select('id, note, duration_minutes, logged_at, skills(name, color)')
      .order('logged_at', { ascending: false })
      .limit(6);
    if (data) setRecentActivity(data as unknown as ActivityLog[]);
  }

  useEffect(() => {
    if (!session) return;
    fetchProfile();
    fetchStats();
    fetchCategoryCoverage();
    fetchRecentActivity();
  }, [session]);

  function formatActivityDate(dateStr: string) {
    const date = new Date(dateStr);
    const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatDuration(minutes: number) {
    return `${parseFloat((minutes / 60).toFixed(1))}h`;
  }

  //Radar computations
  const radarPoints = buildRadarPoints(categoryCoverage.map(c => c.name));

  function buildRadarPolygon(): string {
    return radarPoints.map(({ label, cx, cy }) => {
      const match = categoryCoverage.find(
        c => c.name.toLowerCase() === label.toLowerCase()
      );
      const progress = match?.avgProgress ?? 0;
      const pt = progressToPoint(cx, cy, progress);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  }

  function buildGridRing(scale: number): string {
    return radarPoints.map(({ cx, cy }) => {
      const x = 50 + (cx - 50) * scale;
      const y = 50 + (cy - 50) * scale;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }

  const avatarLetter = profile.full_name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="profile-page">
      <header className="profile-page-header">
        <h1>Profile</h1>
        <p className="profile-date">{today}</p>
      </header>

      {/*User card */}
      <div className="user-profile-card">
        <div className="user-header-row">
          <div className="user-identity">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="user-avatar-large avatar-img" />
            ) : (
              <div className="user-avatar-large">{avatarLetter}</div>
            )}
            <div className="user-details">
              <h2>{profile.full_name || 'Your Name'}</h2>
              <p className="user-title">{profile.title || 'Add a title'}</p>
              <p className="user-bio">{profile.bio || 'Add a bio'}</p>
            </div>
          </div>
          <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>
            <Pencil size={16} />
            Edit profile
          </button>
        </div>

        <div className="user-stats-row">
          <div className="user-stat-item">
            <span className="user-stat-label">Member since</span>
            <span className="user-stat-value">{memberSince}</span>
          </div>
          <div className="user-stat-item">
            <span className="user-stat-label">Total hours</span>
            <span className="user-stat-value">{totalHours}h</span>
          </div>
          <div className="user-stat-item">
            <span className="user-stat-label">Skills tracked</span>
            <span className="user-stat-value">{skillsCount}</span>
          </div>
          <div className="user-stat-item">
            <span className="user-stat-label">Current streak</span>
            <span className="user-stat-value">{streak}<span>days</span></span>
          </div>
        </div>
      </div>

      <div className="profile-middle-grid">

        {/* Skill Coverage */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>Skill Coverage</h3>
            <p>Average progress across categories</p>
          </div>
          <div className="radar-chart-container">
            {categoryCoverage.length === 0 ? (
              <p className="empty-text">Add skills to see coverage.</p>
            ) : (
              <>
                {radarPoints.map(p => (
                  <span key={p.label} className={`radar-label ${p.labelClass}`}>
                    {p.label}
                  </span>
                ))}
                <svg width="200" height="200" viewBox="0 0 100 100">
                  {[1, 0.75, 0.5, 0.25].map(scale => (
                    <polygon
                      key={scale}
                      points={buildGridRing(scale)}
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  ))}
                  {radarPoints.map(p => (
                    <line
                      key={p.label}
                      x1="50" y1="50"
                      x2={p.cx} y2={p.cy}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  ))}
                  <polygon
                    points={buildRadarPolygon()}
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                </svg>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>Badges</h3>
            <p>Milestones earned along the way</p>
          </div>
          <div className="badges-grid">
            {BADGE_DEFINITIONS.map(badge => {
              const earned = earnedBadgeKeys.has(badge.key);
              return (
                <div key={badge.key} className={`badge-card ${earned ? '' : 'inactive'}`}>
                  <div
                    className="badge-icon-wrapper"
                    style={{
                      backgroundColor: earned ? badge.activeBg : '#f3f4f6',
                      color: earned ? badge.activeColor : '#9ca3af',
                    }}
                  >
                    {badge.icon}
                  </div>
                  <h4 style={{ color: earned ? undefined : '#9ca3af' }}>{badge.label}</h4>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/*Recent Activity*/}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <p className="empty-text">No activity logged yet.</p>
          ) : (
            recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <Circle className="activity-icon" size={16} />
                <div className="activity-content">
                  <h4 className="activity-title">
                    {activity.note || `Studied ${activity.skills?.name || 'a skill'}`}
                  </h4>
                  <div className="activity-meta">
                    {activity.skills && (
                      <span
                        className="skill-pill-small"
                        style={{ backgroundColor: activity.skills.color, color: 'white' }}
                      >
                        {activity.skills.name}
                      </span>
                    )}
                    <span className="goal-date-small">{formatActivityDate(activity.logged_at)}</span>
                  </div>
                </div>
                <div className="activity-time">
                  <Clock size={14} />
                  {formatDuration(activity.duration_minutes)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={fetchProfile}
      />
    </div>
  );
}

export default Profile;