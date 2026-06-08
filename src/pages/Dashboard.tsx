import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from "@/components/LogoutButton";
import AddSkillModal from "@/components/AddSkillModal";
import LogActivityModal from '@/components/LogActivityModal';
import SkillCard from '@/components/SkillCard';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import {
  Plus, BookOpen, Flame, Target, Trophy, Search,
  LayoutGrid, List, Clock, CheckSquare, Square, ChevronRight
} from 'lucide-react';
import "../styles/dashboard.css";

interface Skill {
  id: string;
  name: string;
  color: string;
  current_level: string;
  target_hours: number;
  status: string;
  categories: { name: string } | null;
  time_spent?: number;
  last_active?: string;
}

interface Goal {
  id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  skills: { name: string } | null;
}

interface ChartData {
  day: string;
  hours: number;
  height: string;
}

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Dashboard must be used within AuthContextProvider');
  const { session } = auth;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  async function fetchSkills() {
    if (!session) return;

    const { data: skillsData } = await supabase
      .from('skills')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (!skillsData) return;

    const skillsWithTime = await Promise.all(
      skillsData.map(async (skill) => {
        const { data: logs } = await supabase
          .from('learning_logs')
          .select('duration_minutes, logged_at')
          .eq('skill_id', skill.id)
          .order('logged_at', { ascending: false });

        const totalMinutes = logs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
        const timeSpentHours = parseFloat((totalMinutes / 60).toFixed(1));

        let lastActive = 'Never';
        if (logs && logs.length > 0) {
          const lastLog = new Date(logs[0].logged_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) lastActive = 'Today';
          else if (diffDays === 1) lastActive = 'Yesterday';
          else lastActive = `${diffDays} days ago`;
        }

        return { ...skill, time_spent: timeSpentHours, last_active: lastActive };
      })
    );

    setSkills(skillsWithTime);

    const uniqueCategories = [
      ...new Set(skillsWithTime.map(s => s.categories?.name).filter(Boolean))
    ] as string[];
    setCategories(uniqueCategories);
  }

  async function fetchGoals() {
    if (!session) return;

    const { data } = await supabase
      .from('goals')
      .select('*, skills(name)')
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) setGoals(data);
  }

  async function fetchWeeklyActivity() {
    if (!session) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from('learning_logs')
      .select('duration_minutes, logged_at')
      .gte('logged_at', startOfWeek.toISOString());

    const hoursPerDay: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };

    logs?.forEach(log => {
      const day = days[new Date(log.logged_at).getDay()];
      hoursPerDay[day] = parseFloat(
        ((hoursPerDay[day] || 0) + log.duration_minutes / 60).toFixed(1)
      );
    });

    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxHours = Math.max(...Object.values(hoursPerDay), 1);

    const chart = orderedDays.map(day => ({
      day,
      hours: hoursPerDay[day],
      height: `${Math.round((hoursPerDay[day] / maxHours) * 100)}%`,
    }));

    setChartData(chart);
  }

  async function fetchTotalHours() {
    if (!session) return;

    const { data } = await supabase
      .from('learning_logs')
      .select('duration_minutes');

    const total = data?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
    setTotalHours(parseFloat((total / 60).toFixed(1)));
  }

  async function fetchStreak() {
    if (!session) return;

    const { data: logs } = await supabase
      .from('learning_logs')
      .select('logged_at')
      .order('logged_at', { ascending: false });

    if (!logs || logs.length === 0) {
      setStreak(0);
      return;
    }

    const uniqueDates = [
      ...new Set(
        logs.map(log => new Date(log.logged_at).toISOString().split('T')[0])
      )
    ].sort((a, b) => b.localeCompare(a));

    let count = 0;
    const today = new Date().toISOString().split('T')[0];
    let current = new Date(today);

    for (const date of uniqueDates) {
      const expected = current.toISOString().split('T')[0];
      if (date === expected) {
        count++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(count);
  }

  useEffect(() => {
    if (!session) return;
    fetchSkills();
    fetchGoals();
    fetchWeeklyActivity();
    fetchTotalHours();
    fetchStreak();
  }, [session]);

  function handleActivityLogged() {
    fetchSkills();
    fetchWeeklyActivity();
    fetchTotalHours();
    fetchStreak();
  }

  const completedSkills = skills.filter(s => s.status === 'completed').length;

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || skill.categories?.name === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const maxChartHours = Math.max(...chartData.map(d => d.hours), 1);
  const yAxisLabels = [
    `${maxChartHours}h`,
    `${(maxChartHours * 0.75).toFixed(1)}h`,
    `${(maxChartHours * 0.5).toFixed(1)}h`,
    `${(maxChartHours * 0.25).toFixed(1)}h`,
    '0h'
  ];

  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="header-date">{today}</p>
        </div>

        <div className="header-actions">
          <LogoutButton />
          <button className="log-time-btn" onClick={() => setIsActivityModalOpen(true)}>
            <Clock size={18} />
            Log Time
          </button>
          <button className="add-skill-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Add Skill
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <p>Skills Tracking</p>
              <h3>{skills.length}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>
              <Flame size={24} />
            </div>
            <div className="stat-info">
              <p>Day Streak</p>
              <h3>{streak}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <Target size={24} />
            </div>
            <div className="stat-info">
              <p>Hours Logged</p>
              <h3>{totalHours}h</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fdf2f8', color: '#ec4899' }}>
              <Trophy size={24} />
            </div>
            <div className="stat-info">
              <p>Completed</p>
              <h3>{completedSkills}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-middle-grid">
          <div className="chart-card">
            <div className="card-header">
              <h2>Weekly Activity</h2>
              <p>Hours studied per day this week</p>
            </div>
            <div className="chart-container">
              <div className="y-axis">
                {yAxisLabels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
              <div className="bars-wrapper">
                {chartData.length === 0 ? (
                  <p className="empty-text">No activity logged this week.</p>
                ) : (
                  chartData.map((data, index) => (
                    <div
                      key={index}
                      className={`bar-column ${hoveredBar === index ? 'hovered' : ''}`}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {hoveredBar === index && (
                        <div className={`chart-tooltip ${index > 4 ? 'tooltip-left' : ''}`}>
                          <span className="tooltip-day">{data.day}</span>
                          <span className="tooltip-hours">Hours: {data.hours}h</span>
                        </div>
                      )}
                      <div className="bar" style={{ height: data.height }}></div>
                      <span className="x-axis-label">{data.day}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="goals-card">
            <div className="card-header goals-header-row">
              <h2>Active Goals</h2>
              <button className="view-all-btn" onClick={() => navigate('/goals')}>
                View all <ChevronRight size={16} />
              </button>
            </div>
            <div className="dashboard-goals-list">
              {goals.length === 0 ? (
                <p className="empty-text">No active goals yet.</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="dashboard-goal-item">
                    <div className="goal-checkbox-wrapper">
                      {goal.is_completed
                        ? <CheckSquare size={18} color="#6366f1" />
                        : <Square size={18} color="#e5e7eb" />
                      }
                    </div>
                    <div className="dashboard-goal-info">
                      <h4 className={goal.is_completed ? 'completed-text' : ''}>{goal.title}</h4>
                      <div className="dashboard-goal-meta">
                        {goal.skills && (
                          <span className="skill-pill-small">{goal.skills.name}</span>
                        )}
                        {goal.due_date && (
                          <span className="goal-date-small">
                            {new Date(goal.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="skills-section">
          <div className="skills-section-header">
            <h2>My Skills</h2>
            <div className="skills-controls">
              <div className="search-bar">
                <Search size={16} color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="view-toggles">
                <button
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="filters-row">
            {['All', ...categories].map(filter => (
              <button
                key={filter}
                className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredSkills.length === 0 ? (
            <p className="empty-text">No skills found.</p>
          ) : (
            <div className={viewMode === 'grid' ? 'skills-grid-view' : 'skills-list-view'}>
              {filteredSkills.map(skill => (
                <SkillCard key={skill.id} skill={skill} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSkillAdded={fetchSkills}
      />

      <LogActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        skills={skills}
        onActivityLogged={handleActivityLogged}
      />
    </div>
  );
}

export default Dashboard;