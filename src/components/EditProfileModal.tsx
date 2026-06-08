import { useState, useContext, useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

interface Profile {
  full_name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdated: () => void;
}

function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [title, setTitle] = useState(profile.title || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = useContext(AuthContext);
  if (!auth) throw new Error('EditProfileModal must be used within AuthContextProvider');
  const { session } = auth;

  // Sync form when profile prop changes
  useEffect(() => {
    setFullName(profile.full_name || '');
    setTitle(profile.title || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
  }, [profile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setUploading(true);
    setError('');

    const fileExt = file.name.split('.').pop();
    const filePath = `${session.user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError('Failed to upload photo.');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    if (!session) return;
    setLoading(true);
    setError('');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        title: title.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl || null,
      })
      .eq('id', session.user.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onProfileUpdated();
    onClose();
  }

  if (!isOpen) return null;

  const avatarLetter = fullName?.charAt(0).toUpperCase() || '?';

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-profile-modal">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-picture-section">
            <div className="avatar-upload-wrapper">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="user-avatar-large avatar-img" />
              ) : (
                <div className="user-avatar-large" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                  {avatarLetter}
                </div>
              )}
              <button
                className="avatar-camera-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="profile-picture-actions">
              <span>Profile picture</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change photo'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Title / role</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="submit-skill-btn"
            onClick={handleSave}
            disabled={loading || uploading}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;