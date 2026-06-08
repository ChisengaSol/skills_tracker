import { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

interface Skill {
  id: string;
  name: string;
}

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalAdded: () => void;
}

function NewGoalModal({ isOpen, onClose, onGoalAdded }: NewGoalModalProps) {
  const [title, setTitle] = useState('');
  const [skillId, setSkillId] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('NewGoalModal must be used within AuthContextProvider');
  }

  const { session } = auth;

  useEffect(() => {
    if (!isOpen || !session) return;

    async function fetchSkills() {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setSkills(data);
        if (data.length > 0) setSkillId(data[0].id);
      }
    }

    fetchSkills();
  }, [isOpen, session]);

  function resetForm() {
    setTitle('');
    setSkillId('');
    setPriority('medium');
    setDueDate('');
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Goal title is required.');
      return;
    }

    if (!session) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.from('goals').insert({
      user_id: session.user.id,
      skill_id: skillId || null,
      title: title.trim(),
      priority,
      due_date: dueDate || null,
      is_completed: false,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    onGoalAdded();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create a new goal</h2>
          <p>Set an actionable target for your learning</p>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Goal title</label>
            <input
              type="text"
              placeholder="e.g. Complete TypeScript generics module"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Related skill</label>
            {skills.length === 0 ? (
              <p className="no-categories-text">No skills yet. Add a skill first.</p>
            ) : (
              <div className="pill-group">
                {skills.map(skill => (
                  <button
                    key={skill.id}
                    className={`pill-btn ${skillId === skill.id ? 'active' : ''}`}
                    onClick={() => setSkillId(skill.id)}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Priority</label>
            <div className="level-group">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  className={`level-btn ${priority === level ? 'active' : ''}`}
                  onClick={() => setPriority(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleClose}>Cancel</button>
          <button
            className="submit-skill-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewGoalModal;