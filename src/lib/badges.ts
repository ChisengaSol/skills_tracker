import { Flame, Star, Award, TrendingUp, BookOpen } from 'lucide-react';
import React from 'react';

export interface BadgeDefinition {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
  check: (stats: { streak: number; totalHours: number; skillsCount: number }) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: '14_day_streak',
    label: '14-Day Streak',
    icon: React.createElement(Flame, { size: 20 }),
    activeColor: '#f97316',
    activeBg: '#fff7ed',
    check: ({ streak }) => streak >= 14,
  },
  {
    key: 'first_skill',
    label: 'First Skill',
    icon: React.createElement(Star, { size: 20 }),
    activeColor: '#8b5cf6',
    activeBg: '#f3e8ff',
    check: ({ skillsCount }) => skillsCount >= 1,
  },
  {
    key: '100h_logged',
    label: '100h Logged',
    icon: React.createElement(Award, { size: 20 }),
    activeColor: '#10b981',
    activeBg: '#ecfdf5',
    check: ({ totalHours }) => totalHours >= 100,
  },
  {
    key: 'advanced_learner',
    label: 'Advanced Learner',
    icon: React.createElement(TrendingUp, { size: 20 }),
    activeColor: '#3b82f6',
    activeBg: '#eff6ff',
    check: ({ totalHours }) => totalHours >= 200,
  },
  {
    key: '5_skills',
    label: '5 Skills',
    icon: React.createElement(BookOpen, { size: 20 }),
    activeColor: '#ec4899',
    activeBg: '#fdf2f8',
    check: ({ skillsCount }) => skillsCount >= 5,
  },
  {
    key: '30_day_streak',
    label: '30-Day Streak',
    icon: React.createElement(Award, { size: 20 }),
    activeColor: '#f97316',
    activeBg: '#fff7ed',
    check: ({ streak }) => streak >= 30,
  },
];