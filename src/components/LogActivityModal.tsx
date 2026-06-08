import { useState, useContext, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

interface Skill {
  id: string;
  name: string;
}

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onActivityLogged: () => void;
}

function LogActivityModal({ isOpen, onClose, skills, onActivityLogged }: LogActivityModalProps) {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [duration, setDuration] = useState(1.0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('LogActivityModal must be used within AuthContextProvider');
  const { session } = auth;

  useEffect(() => {
    if (skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0].id);
    }
  }, [skills]);

  function resetForm() {
    setSelectedSkill(skills[0]?.id || '');
    setDuration(1.0);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedSkill) {
      setError('Please select a skill.');
      return;
    }

    if (!session) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.from('learning_logs').insert({
      user_id: session.user.id,
      skill_id: selectedSkill,
      duration_minutes: Math.round(duration * 60),
      logged_at: new Date(date).toISOString(),
      note: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    onActivityLogged();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Log Activity</h2>
          <p>Record the time you spent learning</p>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Skill</label>
            {skills.length === 0 ? (
              <p className="no-categories-text">No skills yet. Add a skill first.</p>
            ) : (
              <select
                className="select-input"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group target-hours-row">
            <div className="target-label">
              <label style={{ marginBottom: 0 }}>Duration</label>
              <span>Time spent in hours</span>
            </div>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() => setDuration(Math.max(0.5, duration - 0.5))}
              >
                <Minus size={16} />
              </button>
              <span className="stepper-value">{duration}h</span>
              <button
                className="stepper-btn"
                onClick={() => setDuration(duration + 0.5)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {loading ? 'Saving...' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogActivityModal;