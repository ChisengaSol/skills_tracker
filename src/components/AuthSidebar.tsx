import React from 'react';
import { BookOpen } from 'lucide-react';
import "../styles/authsidebar.css"

function AuthSidebar(){
    const currentYear = new Date().getFullYear();
    return(
        <div className="sidebar-container">
      
      {/* Background Pattern */}
      <div className="sidebar-bg-pattern" aria-hidden="true" />

      {/* Top Section: Logo & Brand */}
      <div className="relative-content sidebar-header">
        <div className="sidebar-logo-icon">
          <BookOpen size={20} color="white" />
        </div>
        <span className="sidebar-brand-name">SkillTrack</span>
      </div>

      {/* Middle Section: Quote & Stats */}
      <div className="relative-content sidebar-main">
        <h1 className="sidebar-quote">
          "An investment in knowledge <br /> pays the best interest."
        </h1>
        <p className="sidebar-author">
          — Benjamin Franklin
        </p>

        <div className="sidebar-stats">
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-number">9+</span>
            <span className="sidebar-stat-label">Skills trackable at once</span>
          </div>
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-number">14</span>
            <span className="sidebar-stat-label">Day learning streak</span>
          </div>
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-number">295h</span>
            <span className="sidebar-stat-label">Total hours logged</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Footer */}
      <div className="relative-content sidebar-footer">
        © {currentYear} SkillTrack
      </div>
      
    </div>
    )
}

export default AuthSidebar