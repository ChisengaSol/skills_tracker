import React from "react";
import { BookOpen, BarChart2, Target, Trophy, Clock, Flame } from "lucide-react";
import "../styles/authsidebar.css";

function AuthSidebar() {
  const currentYear = new Date().getFullYear();

  const features = [
    {
      icon: <BarChart2 size={18} />,
      title: "Track your progress",
      description: "Log hours and visualize growth across all your skills",
    },
    {
      icon: <Target size={18} />,
      title: "Set goals",
      description: "Create actionable targets with deadlines and priorities",
    },
    {
      icon: <Trophy size={18} />,
      title: "Earn badges",
      description: "Get rewarded as you hit streaks and milestones",
    },
    {
      icon: <Clock size={18} />,
      title: "Log activity",
      description: "Record every learning session with notes and duration",
    },
    {
      icon: <Flame size={18} />,
      title: "Build streaks",
      description: "Stay consistent and maintain your daily learning habit",
    },
  ];

  return (
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

      {/* Middle Section: Quote & Features */}
      <div className="relative-content sidebar-main">
        <h1 className="sidebar-quote">
          "An investment in knowledge <br /> pays the best interest."
        </h1>
        <p className="sidebar-author">— Benjamin Franklin</p>

        <div className="sidebar-features">
          {features.map((feature, index) => (
            <div key={index} className="sidebar-feature-row">
              <div className="sidebar-feature-icon">{feature.icon}</div>
              <div className="sidebar-feature-text">
                <span className="sidebar-feature-title">{feature.title}</span>
                <span className="sidebar-feature-desc">{feature.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Footer */}
      <div className="relative-content sidebar-footer">
        &copy;{currentYear} SkillTrack
      </div>
    </div>
  );
}

export default AuthSidebar;