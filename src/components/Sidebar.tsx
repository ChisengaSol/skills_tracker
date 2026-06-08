import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Book, Target, User, Settings, BookOpen } from 'lucide-react';
import '../styles/sidebar.css';

function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <BookOpen size={20} />
        </div>
        <span className="brand-text">SkillTrack</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        
        <Link to="/skills" className={`nav-item ${isActive('/skills') ? 'active' : ''}`}>
          <Book size={20} />
          Skills
        </Link>
        
        <Link to="/goals" className={`nav-item ${isActive('/goals') ? 'active' : ''}`}>
          <Target size={20} />
          Goals
        </Link>
        
        <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <User size={20} />
          Profile
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;