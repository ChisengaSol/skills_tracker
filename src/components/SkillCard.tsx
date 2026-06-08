import React, { useState, useEffect, useContext } from 'react';
import { Clock, TrendingUp, X, CheckCircle2, Circle as CircleIcon, Calendar, Plus, Trash2 } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

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

interface Milestone {
  id: string;
  title: string;
  is_completed: boolean;
}

interface SkillCardProps {
  skill: Skill;
  viewMode: 'grid' | 'list';
}

function SkillCard({ skill, viewMode }: SkillCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('SkillCard must be used within AuthContextProvider');
  const { session } = auth;

  const progressPercentage = Math.min(
    Math.round(((skill.time_spent || 0) / (skill.target_hours || 1)) * 100),
    100
  );

  async function fetchMilestones() {
    setLoadingMilestones(true);

    const { data, error } = await supabase
      .from('milestones')
      .select('id, title, is_completed')
      .eq('skill_id', skill.id)
      .order('created_at', { ascending: true });

    if (!error && data) setMilestones(data);
    setLoadingMilestones(false);
  }

  useEffect(() => {
    if (isDetailModalOpen) {
      fetchMilestones();
    }
  }, [isDetailModalOpen]);

  async function toggleMilestone(milestone: Milestone) {
    const { error } = await supabase
      .from('milestones')
      .update({ is_completed: !milestone.is_completed })
      .eq('id', milestone.id);

    if (!error) fetchMilestones();
  }

  async function addMilestone() {
    if (!newMilestone.trim() || !session) return;

    const { error } = await supabase.from('milestones').insert({
      user_id: session.user.id,
      skill_id: skill.id,
      title: newMilestone.trim(),
      is_completed: false,
    });

    if (!error) {
      setNewMilestone('');
      setAddingMilestone(false);
      fetchMilestones();
    }
  }

  async function deleteMilestone(id: string) {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (!error) fetchMilestones();
  }

  const renderModal = () => {
    if (!isDetailModalOpen) return null;

    return (
      <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
        <div className="modal-content skill-detail-modal" onClick={e => e.stopPropagation()}>

          <div className="modal-header detail-header">
            <div className="detail-header-left">
              <div className="skill-grid-icon" style={{ backgroundColor: skill.color, width: '3rem', height: '3rem', fontSize: '1.25rem' }}>
                {skill.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{skill.name}</h2>
                <p>{skill.categories?.name || 'Uncategorized'}</p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body detail-body">
            <div className="detail-progress-section">
              <div className="circular-progress-container">
                <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '120px', height: '120px' }}>
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${progressPercentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke={skill.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>

              <div className="detail-stats-wrapper">
                <div className="overall-progress-text">
                  <h3>{progressPercentage}%</h3>
                  <p>overall progress</p>
                </div>
                <div className="detail-stats-cards">
                  <div className="stat-box">
                    <div className="stat-box-label">
                      <Clock size={14} /> Logged
                    </div>
                    <div className="stat-box-value">{skill.time_spent || 0}h</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-label">
                      <TrendingUp size={14} /> Target
                    </div>
                    <div className="stat-box-value">{skill.target_hours}h</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="milestones-section">
              <div className="milestones-header">
                <h3>Milestones</h3>
                <button
                  className="add-milestone-btn"
                  onClick={() => setAddingMilestone(true)}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {addingMilestone && (
                <div className="milestone-input-row">
                  <input
                    type="text"
                    placeholder="e.g. Complete chapter 3"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addMilestone();
                      if (e.key === 'Escape') {
                        setAddingMilestone(false);
                        setNewMilestone('');
                      }
                    }}
                    autoFocus
                  />
                  <button className="milestone-save-btn" onClick={addMilestone}>Save</button>
                  <button
                    className="milestone-cancel-btn"
                    onClick={() => {
                      setAddingMilestone(false);
                      setNewMilestone('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="milestones-list">
                {loadingMilestones ? (
                  <p className="empty-text">Loading...</p>
                ) : milestones.length === 0 ? (
                  <p className="empty-text">No milestones yet. Add one above.</p>
                ) : (
                  milestones.map(milestone => (
                    <div key={milestone.id} className="milestone-item">
                      <button
                        className="milestone-toggle"
                        onClick={() => toggleMilestone(milestone)}
                      >
                        {milestone.is_completed ? (
                          <CheckCircle2 size={18} color="#10b981" />
                        ) : (
                          <CircleIcon size={18} color="#d1d5db" />
                        )}
                      </button>
                      <span className={milestone.is_completed ? 'completed-text' : ''}>
                        {milestone.title}
                      </span>
                      <button
                        className="milestone-delete-btn"
                        onClick={() => deleteMilestone(milestone.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer detail-footer">
            <Calendar size={14} />
            <span>Last studied {skill.last_active?.toLowerCase() || 'never'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <>
        <div className="skill-grid-card clickable-card" onClick={() => setIsDetailModalOpen(true)}>
          <div className="skill-grid-header">
            <div className="skill-grid-icon" style={{ backgroundColor: skill.color }}>
              {skill.name.charAt(0).toUpperCase()}
            </div>
            <span className={`level-badge ${skill.current_level}`}>
              {skill.current_level}
            </span>
          </div>

          <div className="skill-grid-titles">
            <h3>{skill.name}</h3>
            <p>{skill.categories?.name}</p>
          </div>

          <div className="skill-grid-progress">
            <div className="progress-labels">
              <span>Progress</span>
              <span style={{ color: skill.color, fontWeight: 500 }}>
                {progressPercentage}%
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%`, backgroundColor: skill.color }}
              ></div>
            </div>
          </div>

          <div className="skill-grid-footer">
            <div className="footer-time">
              <Clock size={14} />
              <span>{skill.time_spent || 0}h / {skill.target_hours}h</span>
            </div>
            <div className="footer-activity">
              <TrendingUp size={14} />
              <span>{skill.last_active || 'Never'}</span>
            </div>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="skill-list-row clickable-card" onClick={() => setIsDetailModalOpen(true)}>
        <div className="list-left">
          <div className="skill-grid-icon" style={{ backgroundColor: skill.color }}>
            {skill.name.charAt(0).toUpperCase()}
          </div>
          <div className="list-titles">
            <h3>{skill.name}</h3>
            <p>{skill.categories?.name}</p>
          </div>
        </div>

        <div className="list-middle">
          <div className="progress-bar-bg list-progress">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%`, backgroundColor: skill.color }}
            ></div>
          </div>
        </div>

        <div className="list-right">
          <span className="list-percentage">{progressPercentage}%</span>
          <span className="list-time">{skill.time_spent || 0}h / {skill.target_hours}h</span>
        </div>
      </div>
      {renderModal()}
    </>
  );
}

export default SkillCard;