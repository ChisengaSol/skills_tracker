import { useState, useEffect, useContext } from 'react';
import { Plus, Circle, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import NewGoalModal from '../components/NewGoalModal';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import '../styles/goals.css';

interface Goal {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_completed: boolean;
  skills: { name: string } | null;
}

function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Goals must be used within AuthContextProvider');
  const { session } = auth;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  async function fetchGoals() {
    if (!session) return;

    const { data, error } = await supabase
      .from('goals')
      .select('*, skills(name)')
      .order('created_at', { ascending: false });

    if (!error && data) setGoals(data);
  }

  useEffect(() => {
    fetchGoals();
  }, [session]);

  async function toggleGoal(id: string) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const { error } = await supabase
      .from('goals')
      .update({ is_completed: !goal.is_completed })
      .eq('id', id);

    if (!error) fetchGoals();
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) fetchGoals();
  }

  function isOverdue(due_date: string | null, is_completed: boolean) {
    if (!due_date || is_completed) return false;
    return new Date(due_date) < new Date();
  }

  function formatDate(due_date: string | null) {
    if (!due_date) return '';
    return new Date(due_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'Active') return !goal.is_completed;
    if (filter === 'Done') return goal.is_completed;
    return true;
  });

  const activeCount = goals.filter(g => !g.is_completed).length;
  const doneCount = goals.filter(g => g.is_completed).length;

  return (
    <div className="goals-page">
      <header className="goals-header">
        <div className="goals-header-left">
          <h1>Goals</h1>
          <p className="goals-date">{today}</p>
        </div>
        <button className="new-goal-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          New Goal
        </button>
      </header>

      <div className="goals-stats">
        {activeCount} active · {doneCount} completed
      </div>

      <div className="goals-filters">
        {['All', 'Active', 'Done'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="goals-list">
        {filteredGoals.length === 0 ? (
          <p className="empty-text">No goals here yet.</p>
        ) : (
          filteredGoals.map(goal => (
            <div key={goal.id} className="goal-card">
              <button
                className={`goal-checkbox ${goal.is_completed ? 'completed' : ''}`}
                onClick={() => toggleGoal(goal.id)}
              >
                {goal.is_completed
                  ? <CheckCircle2 size={20} />
                  : <Circle size={20} />
                }
              </button>

              <div className="goal-content">
                <span className={`goal-title ${goal.is_completed ? 'completed' : ''}`}>
                  {goal.title}
                </span>

                <div className="goal-meta">
                  {goal.skills && (
                    <span className="skill-pill">{goal.skills.name}</span>
                  )}

                  <div className="priority-pill">
                    <span className={`priority-dot ${goal.priority}`}></span>
                    {goal.priority}
                  </div>

                  {goal.due_date && (
                    <div className={`date-pill ${isOverdue(goal.due_date, goal.is_completed) ? 'overdue' : ''}`}>
                      <Clock size={14} />
                      {isOverdue(goal.due_date, goal.is_completed) ? 'Overdue · ' : ''}
                      {formatDate(goal.due_date)}
                    </div>
                  )}
                </div>
              </div>

              <button className="goal-delete" onClick={() => deleteGoal(goal.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoalAdded={fetchGoals}
      />
    </div>
  );
}

export default Goals;