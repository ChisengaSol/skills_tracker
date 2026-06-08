import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import SkillCard from '@/components/SkillCard';
import AddSkillModal from '@/components/AddSkillModal';
import { Plus, Search } from 'lucide-react';
import '../styles/skills.css';

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

function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All levels');
  const [sortBy, setSortBy] = useState('Name');

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Skills must be used within AuthContextProvider');
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

  useEffect(() => {
    fetchSkills();
  }, [session]);

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || skill.categories?.name === activeCategory;
    const matchesLevel = activeLevel === 'All levels' || skill.current_level.toLowerCase() === activeLevel.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'Name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'Progress') {
      const progA = ((a.time_spent || 0) / (a.target_hours || 1));
      const progB = ((b.time_spent || 0) / (b.target_hours || 1));
      return progB - progA;
    }
    return 0;
  });

  return (
    <div className="skills-page">
      <header className="skills-page-header">
        <div className="skills-header-left">
          <h1>Skills</h1>
          <p className="skills-date">{today}</p>
        </div>
        <button className="add-skill-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Skill
        </button>
      </header>

      <div className="skills-summary">
        <h2>{activeCategory === 'All' ? 'All Skills' : `${activeCategory} Skills`}</h2>
        <p>{filteredSkills.length} {filteredSkills.length === 1 ? 'skill' : 'skills'} being tracked</p>
      </div>

      <div className="skills-toolbar">
        <div className="toolbar-left">
          <div className="skills-search">
            <Search size={16} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="skills-filters">
            {['All', ...categories].map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          <select 
            className="skills-dropdown"
            value={activeLevel}
            onChange={(e) => setActiveLevel(e.target.value)}
          >
            <option value="All levels">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select 
            className="skills-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Name">Sort: Name</option>
            <option value="Progress">Sort: Progress</option>
          </select>
        </div>
      </div>

      {filteredSkills.length === 0 ? (
        <p className="empty-text">No skills found matching your filters.</p>
      ) : (
        <div className="skills-grid-container">
          {filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} viewMode="grid" />
          ))}
        </div>
      )}

      <AddSkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSkillAdded={fetchSkills}
      />
    </div>
  );
}

export default Skills;