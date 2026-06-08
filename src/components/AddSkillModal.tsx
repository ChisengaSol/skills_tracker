import { useState, useEffect, useContext } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#0ea5e9', '#14b8a6', '#f43f5e', '#a855f7', '#334155'];

interface Category {
  id: string;
  name: string;
}

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded: () => void;
}

function AddSkillModal({ isOpen, onClose, onSkillAdded }: AddSkillModalProps) {
  const [skillName, setSkillName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [targetHours, setTargetHours] = useState(50);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('AddSkillModal must be used within AuthContextProvider');
  }

  const { session } = auth;

  // Load user's categories from DB
  useEffect(() => {
    if (!isOpen || !session) return;

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      }
    }

    fetchCategories();
  }, [isOpen, session]);

  function resetForm() {
    setSkillName('');
    setLevel('Beginner');
    setTargetHours(50);
    setSelectedColor(COLORS[0]);
    setError('');
    if (categories.length > 0) setCategoryId(categories[0].id);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!skillName.trim()) {
      setError('Skill name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    if (!session) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.from('skills').insert({
      user_id: session.user.id,
      category_id: categoryId,
      name: skillName.trim(),
      current_level: level.toLowerCase(),
      target_hours: targetHours,
      color: selectedColor,
      status: 'not_started',
      progress: 0,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    onSkillAdded(); // tell dashboard to refresh skills list
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">

        <div className="modal-header">
          <h2>Add a new skill</h2>
          <p>Start tracking your learning progress</p>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Skill name</label>
            <input
              type="text"
              placeholder="e.g. TypeScript, Piano, Spanish..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            {categories.length === 0 ? (
              <p className="no-categories-text">
                No categories yet. Please add a category first.
              </p>
            ) : (
              <div className="pill-group">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`pill-btn ${categoryId === cat.id ? 'active' : ''}`}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Current level</label>
            <div className="level-group">
              {LEVELS.map(lvl => (
                <button
                  key={lvl}
                  className={`level-btn ${level === lvl ? 'active' : ''}`}
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group target-hours-row">
            <div className="target-label">
              <label style={{ marginBottom: 0 }}>Target hours</label>
              <span>How many hours to reach your goal</span>
            </div>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() => setTargetHours(Math.max(1, targetHours - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="stepper-value">{targetHours}h</span>
              <button
                className="stepper-btn"
                onClick={() => setTargetHours(targetHours + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-group">
              {COLORS.map(color => (
                <button
                  key={color}
                  className="color-circle"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-icon" style={{ backgroundColor: selectedColor }}>
              {skillName ? skillName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="preview-info">
              <h4>{skillName || 'Skill name'}</h4>
              <p>{categories.find(c => c.id === categoryId)?.name || 'Category'} • {level.toLowerCase()} • {targetHours}h target</p>
            </div>
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
            {loading ? 'Adding...' : 'Add skill'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddSkillModal;