'use client';

import React from 'react';

// Define available icon categories and names
export type IconCategory = 'muscle-groups' | 'equipment' | 'actions' | 'ui';

export type MuscleGroupIcon = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core' | 'calves';
export type EquipmentIcon = 'barbell' | 'dumbbell' | 'machine' | 'fixed-bar';
export type ActionIcon = 'play' | 'pause' | 'stop' | 'timer' | 'calculator' | 'next' | 'previous' | 'finish' | 'delete';
export type UIIcon = 'calendar' | 'checkmark' | 'settings' | 'workout' | 'templates' | 'history' | 'progress' | 'exercises' | 'close' | 'home';

export type IconName = MuscleGroupIcon | EquipmentIcon | ActionIcon | UIIcon;

interface IconProps {
  category: IconCategory;
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
}

// Icon definitions as inline SVGs for better control
const IconSVGs = {
  'muscle-groups': {
    chest: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Head */}
        <circle cx="16" cy="6" r="3" fill={color} fillOpacity="0.3"/>
        {/* Neck */}
        <rect x="15" y="8.5" width="2" height="2" fill={color} fillOpacity="0.3"/>
        {/* Chest/Pectorals - Main focus */}
        <path d="M10 11C8 11 7 12 7 14V18C7 20 8 21 10 21H11C12 21 13 20 13 19V15C13 13 12 11 10 11Z" fill={color}/>
        <path d="M22 11C24 11 25 12 25 14V18C25 20 24 21 22 21H21C20 21 19 20 19 19V15C19 13 20 11 22 11Z" fill={color}/>
        {/* Sternum line */}
        <line x1="16" y1="11" x2="16" y2="21" stroke={color} strokeWidth="1" opacity="0.4"/>
        {/* Shoulders (minimal) */}
        <circle cx="7" cy="13" r="2" fill={color} fillOpacity="0.6"/>
        <circle cx="25" cy="13" r="2" fill={color} fillOpacity="0.6"/>
        {/* Arms (minimal) */}
        <rect x="5" y="15" width="2" height="8" rx="1" fill={color} fillOpacity="0.4"/>
        <rect x="25" y="15" width="2" height="8" rx="1" fill={color} fillOpacity="0.4"/>
        {/* Torso outline */}
        <path d="M13 21V26C13 27 14 28 15 28H17C18 28 19 27 19 26V21" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
    ),
    back: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Head */}
        <circle cx="16" cy="6" r="3" fill={color} fillOpacity="0.3"/>
        {/* Neck */}
        <rect x="15" y="8.5" width="2" height="2" fill={color} fillOpacity="0.3"/>
        {/* Trapezius */}
        <path d="M8 11L16 9L24 11L22 15L18 13L16 14L14 13L10 15L8 11Z" fill={color}/>
        {/* Latissimus Dorsi - Main back muscles */}
        <path d="M10 15C8 15 7 16 7 18V24C7 26 8 27 10 27L13 25V20C13 17 12 15 10 15Z" fill={color}/>
        <path d="M22 15C24 15 25 16 25 18V24C25 26 24 27 22 27L19 25V20C19 17 20 15 22 15Z" fill={color}/>
        {/* Spine line */}
        <line x1="16" y1="9" x2="16" y2="27" stroke={color} strokeWidth="1.5" opacity="0.4"/>
        {/* Lower back */}
        <path d="M13 25V28C13 29 14 30 15 30H17C18 30 19 29 19 28V25" stroke={color} strokeWidth="1.5" fill="none"/>
        {/* Rhomboids (upper back detail) */}
        <path d="M12 13L16 12L20 13L18 16L16 15L14 16L12 13Z" fill={color} fillOpacity="0.7"/>
      </svg>
    ),
    shoulders: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Head */}
        <circle cx="16" cy="6" r="3" fill={color} fillOpacity="0.3"/>
        {/* Neck */}
        <rect x="15" y="8.5" width="2" height="2" fill={color} fillOpacity="0.3"/>
        {/* Left Deltoid - Main focus */}
        <circle cx="8" cy="13" r="4.5" fill={color}/>
        <path d="M4 13C4 10 6 8 8 8C10 8 12 10 12 13C12 16 10 18 8 18C6 18 4 16 4 13Z" fill={color}/>
        {/* Right Deltoid - Main focus */}
        <circle cx="24" cy="13" r="4.5" fill={color}/>
        <path d="M20 13C20 10 22 8 24 8C26 8 28 10 28 13C28 16 26 18 24 18C22 18 20 16 20 13Z" fill={color}/>
        {/* Upper body connection */}
        <rect x="12" y="11" width="8" height="6" rx="1" fill={color} fillOpacity="0.4"/>
        {/* Arms extending from shoulders */}
        <path d="M8 18V24C8 25 9 26 10 26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 18V24C24 25 23 26 22 26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        {/* Clavicle line */}
        <path d="M12 11L20 11" stroke={color} strokeWidth="1" opacity="0.5"/>
        {/* Muscle definition lines */}
        <path d="M8 10L8 16" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M24 10L24 16" stroke="white" strokeWidth="0.5" opacity="0.6"/>
      </svg>
    ),
    arms: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Left arm */}
        {/* Shoulder */}
        <circle cx="7" cy="8" r="2.5" fill={color} fillOpacity="0.6"/>
        {/* Upper arm (bicep/tricep) */}
        <ellipse cx="7" cy="14" rx="2.5" ry="5" fill={color}/>
        {/* Bicep peak */}
        <ellipse cx="6.5" cy="12" rx="1.5" ry="2.5" fill={color}/>
        {/* Forearm */}
        <ellipse cx="7" cy="22" rx="2" ry="4" fill={color} fillOpacity="0.8"/>
        {/* Hand */}
        <circle cx="7" cy="27" r="1.5" fill={color} fillOpacity="0.6"/>
        
        {/* Right arm */}
        {/* Shoulder */}
        <circle cx="25" cy="8" r="2.5" fill={color} fillOpacity="0.6"/>
        {/* Upper arm (bicep/tricep) */}
        <ellipse cx="25" cy="14" rx="2.5" ry="5" fill={color}/>
        {/* Bicep peak */}
        <ellipse cx="25.5" cy="12" rx="1.5" ry="2.5" fill={color}/>
        {/* Forearm */}
        <ellipse cx="25" cy="22" rx="2" ry="4" fill={color} fillOpacity="0.8"/>
        {/* Hand */}
        <circle cx="25" cy="27" r="1.5" fill={color} fillOpacity="0.6"/>
        
        {/* Body silhouette (minimal) */}
        <rect x="13" y="8" width="6" height="12" rx="2" fill={color} fillOpacity="0.2"/>
        
        {/* Muscle definition lines */}
        <path d="M7 11L7 17" stroke="white" strokeWidth="0.5" opacity="0.7"/>
        <path d="M25 11L25 17" stroke="white" strokeWidth="0.5" opacity="0.7"/>
        <path d="M7 19L7 25" stroke="white" strokeWidth="0.5" opacity="0.5"/>
        <path d="M25 19L25 25" stroke="white" strokeWidth="0.5" opacity="0.5"/>
      </svg>
    ),
    legs: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Torso (minimal) */}
        <rect x="12" y="4" width="8" height="8" rx="2" fill={color} fillOpacity="0.3"/>
        
        {/* Left leg */}
        {/* Hip/Glute connection */}
        <ellipse cx="11" cy="12" rx="2" ry="1.5" fill={color} fillOpacity="0.6"/>
        {/* Quadriceps (front thigh) */}
        <ellipse cx="11" cy="18" rx="2.5" ry="6" fill={color}/>
        {/* Quad muscle definition */}
        <path d="M9 15L9 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M11 15L11 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M13 15L13 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        {/* Knee */}
        <circle cx="11" cy="24" r="1" fill={color} fillOpacity="0.7"/>
        {/* Lower leg */}
        <ellipse cx="11" cy="27" rx="1.5" ry="3" fill={color} fillOpacity="0.8"/>
        {/* Foot */}
        <ellipse cx="11" cy="30.5" rx="2" ry="1" fill={color} fillOpacity="0.6"/>
        
        {/* Right leg */}
        {/* Hip/Glute connection */}
        <ellipse cx="21" cy="12" rx="2" ry="1.5" fill={color} fillOpacity="0.6"/>
        {/* Quadriceps (front thigh) */}
        <ellipse cx="21" cy="18" rx="2.5" ry="6" fill={color}/>
        {/* Quad muscle definition */}
        <path d="M19 15L19 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M21 15L21 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M23 15L23 21" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        {/* Knee */}
        <circle cx="21" cy="24" r="1" fill={color} fillOpacity="0.7"/>
        {/* Lower leg */}
        <ellipse cx="21" cy="27" rx="1.5" ry="3" fill={color} fillOpacity="0.8"/>
        {/* Foot */}
        <ellipse cx="21" cy="30.5" rx="2" ry="1" fill={color} fillOpacity="0.6"/>
        
        {/* Hamstring hint (back of leg) */}
        <ellipse cx="10.5" cy="18" rx="1" ry="4" fill={color} fillOpacity="0.4"/>
        <ellipse cx="21.5" cy="18" rx="1" ry="4" fill={color} fillOpacity="0.4"/>
      </svg>
    ),
    glutes: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Lower back */}
        <rect x="13" y="8" width="6" height="4" rx="1" fill={color} fillOpacity="0.3"/>
        
        {/* Main glute muscles */}
        {/* Left glute */}
        <ellipse cx="11" cy="16" rx="4" ry="5" fill={color}/>
        <path d="M7 16C7 13 9 11 11 11C13 11 15 13 15 16C15 19 13 21 11 21C9 21 7 19 7 16Z" fill={color}/>
        
        {/* Right glute */}
        <ellipse cx="21" cy="16" rx="4" ry="5" fill={color}/>
        <path d="M17 16C17 13 19 11 21 11C23 11 25 13 25 16C25 19 23 21 21 21C19 21 17 19 17 16Z" fill={color}/>
        
        {/* Glute separation line */}
        <path d="M16 12L16 20" stroke="white" strokeWidth="1" opacity="0.4"/>
        
        {/* Hip bone structure */}
        <path d="M8 12L11 11L16 12L21 11L24 12" stroke={color} strokeWidth="1.5" opacity="0.6"/>
        
        {/* Upper leg connection */}
        <ellipse cx="11" cy="22" rx="2" ry="3" fill={color} fillOpacity="0.6"/>
        <ellipse cx="21" cy="22" rx="2" ry="3" fill={color} fillOpacity="0.6"/>
        
        {/* Muscle definition */}
        <path d="M9 14L9 18" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M13 14L13 18" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M19 14L19 18" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M23 14L23 18" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Glute medius (side muscle) */}
        <ellipse cx="7.5" cy="15" rx="1.5" ry="2" fill={color} fillOpacity="0.8"/>
        <ellipse cx="24.5" cy="15" rx="1.5" ry="2" fill={color} fillOpacity="0.8"/>
      </svg>
    ),
    core: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Torso outline */}
        <path d="M10 8C10 6 12 4 16 4C20 4 22 6 22 8V24C22 26 20 28 16 28C12 28 10 26 10 24V8Z" fill={color} fillOpacity="0.2"/>
        
        {/* Rectus Abdominis (6-pack) */}
        {/* Upper abs */}
        <rect x="13.5" y="10" width="2" height="2.5" rx="0.5" fill={color}/>
        <rect x="16.5" y="10" width="2" height="2.5" rx="0.5" fill={color}/>
        
        {/* Middle abs */}
        <rect x="13.5" y="13.5" width="2" height="2.5" rx="0.5" fill={color}/>
        <rect x="16.5" y="13.5" width="2" height="2.5" rx="0.5" fill={color}/>
        
        {/* Lower abs */}
        <rect x="13.5" y="17" width="2" height="2.5" rx="0.5" fill={color}/>
        <rect x="16.5" y="17" width="2" height="2.5" rx="0.5" fill={color}/>
        
        {/* Obliques */}
        <path d="M11 12L13 14L11 16L9 14L11 12Z" fill={color} fillOpacity="0.8"/>
        <path d="M21 12L23 14L21 16L19 14L21 12Z" fill={color} fillOpacity="0.8"/>
        <path d="M11 16L13 18L11 20L9 18L11 16Z" fill={color} fillOpacity="0.8"/>
        <path d="M21 16L23 18L21 20L19 18L21 16Z" fill={color} fillOpacity="0.8"/>
        
        {/* Linea Alba (center line) */}
        <line x1="16" y1="10" x2="16" y2="20" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Serratus anterior (side ribs) */}
        <path d="M9 10L11 11L9 12" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        <path d="M23 10L21 11L23 12" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        <path d="M9 13L11 14L9 15" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        <path d="M23 13L21 14L23 15" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        
        {/* Transverse abdominis (deep core) */}
        <ellipse cx="16" cy="15" rx="6" ry="3" fill={color} fillOpacity="0.3"/>
      </svg>
    ),
    calves: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Upper leg (minimal) */}
        <rect x="11" y="4" width="4" height="8" rx="1" fill={color} fillOpacity="0.3"/>
        <rect x="17" y="4" width="4" height="8" rx="1" fill={color} fillOpacity="0.3"/>
        
        {/* Knee */}
        <circle cx="13" cy="13" r="1.5" fill={color} fillOpacity="0.5"/>
        <circle cx="19" cy="13" r="1.5" fill={color} fillOpacity="0.5"/>
        
        {/* Left calf */}
        {/* Gastrocnemius (main calf muscle) */}
        <ellipse cx="13" cy="20" rx="2.5" ry="6" fill={color}/>
        <path d="M11 17C11 15 12 14 13 14C14 14 15 15 15 17V23C15 25 14 26 13 26C12 26 11 25 11 23V17Z" fill={color}/>
        
        {/* Right calf */}
        {/* Gastrocnemius (main calf muscle) */}
        <ellipse cx="19" cy="20" rx="2.5" ry="6" fill={color}/>
        <path d="M17 17C17 15 18 14 19 14C20 14 21 15 21 17V23C21 25 20 26 19 26C18 26 17 25 17 23V17Z" fill={color}/>
        
        {/* Soleus (deeper calf muscle) */}
        <ellipse cx="12.5" cy="22" rx="1.5" ry="4" fill={color} fillOpacity="0.7"/>
        <ellipse cx="19.5" cy="22" rx="1.5" ry="4" fill={color} fillOpacity="0.7"/>
        
        {/* Achilles tendon */}
        <path d="M13 26V28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M19 26V28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        
        {/* Ankle/foot */}
        <ellipse cx="13" cy="29" rx="2" ry="1.5" fill={color} fillOpacity="0.6"/>
        <ellipse cx="19" cy="29" rx="2" ry="1.5" fill={color} fillOpacity="0.6"/>
        
        {/* Muscle definition lines */}
        <path d="M13 17L13 25" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        <path d="M19 17L19 25" stroke="white" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Calf diamond shape (classic bodybuilding look) */}
        <path d="M11.5 19L13 17L14.5 19L13 21L11.5 19Z" stroke="white" strokeWidth="0.3" fill="none" opacity="0.5"/>
        <path d="M17.5 19L19 17L20.5 19L19 21L17.5 19Z" stroke="white" strokeWidth="0.3" fill="none" opacity="0.5"/>
      </svg>
    ),
  },
  'ui': {
    home: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 12V19C19 19.5 18.5 20 18 20H15V16C15 15.5 14.5 15 14 15H10C9.5 15 9 15.5 9 16V20H6C5.5 20 5 19.5 5 19V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="8" r="1" fill={color}/>
      </svg>
    ),
    workout: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="10" width="12" height="4" rx="2" fill={color}/>
        <circle cx="4" cy="12" r="2" fill={color}/>
        <circle cx="20" cy="12" r="2" fill={color}/>
        <path d="M8 8V7C8 6.5 8.5 6 9 6H15C15.5 6 16 6.5 16 7V8" stroke={color} strokeWidth="1.5"/>
        <path d="M8 16V17C8 17.5 8.5 18 9 18H15C15.5 18 16 17.5 16 17V16" stroke={color} strokeWidth="1.5"/>
        <path d="M10 12H14" stroke="white" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    calendar: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="15" rx="2" fill={color}/>
        <path d="M3 10H21" stroke="white" strokeWidth="1.5"/>
        <path d="M8 3V7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 3V7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8" cy="14" r="1" fill="white"/>
        <circle cx="12" cy="14" r="1" fill="white"/>
        <circle cx="16" cy="14" r="1" fill="white"/>
        <circle cx="8" cy="17" r="1" fill="white"/>
        <circle cx="12" cy="17" r="1" fill="white"/>
      </svg>
    ),
    checkmark: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    settings: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill={color}/>
        <path d="M12 2L13.2 6.8C13.6 6.9 14 7.1 14.4 7.4L19.2 6.2L21 10L16.9 13.1C17 13.4 17 13.6 17 14C17 14.4 17 14.6 16.9 14.9L21 18L19.2 21.8L14.4 20.6C14 20.9 13.6 21.1 13.2 21.2L12 26L10.8 21.2C10.4 21.1 10 20.9 9.6 20.6L4.8 21.8L3 18L7.1 14.9C7 14.6 7 14.4 7 14C7 13.6 7 13.4 7.1 13.1L3 10L4.8 6.2L9.6 7.4C10 7.1 10.4 6.9 10.8 6.8L12 2Z" fill={color}/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    ),
    templates: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" fill={color}/>
        <rect x="7" y="7" width="10" height="2" rx="1" fill="white"/>
        <rect x="7" y="11" width="7" height="2" rx="1" fill="white"/>
        <rect x="7" y="15" width="10" height="2" rx="1" fill="white"/>
        <circle cx="17" cy="12" r="1" fill="white"/>
      </svg>
    ),
    history: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M12 6V12L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="1" fill="white"/>
      </svg>
    ),
    progress: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="18" width="3" height="4" fill={color}/>
        <rect x="8" y="14" width="3" height="8" fill={color}/>
        <rect x="12" y="10" width="3" height="12" fill={color}/>
        <rect x="16" y="6" width="3" height="16" fill={color}/>
        <path d="M3 5L9 11L13 7L21 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    exercises: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="8" y="10" width="8" height="4" rx="2" fill={color}/>
        <circle cx="5" cy="12" r="2.5" fill={color}/>
        <circle cx="19" cy="12" r="2.5" fill={color}/>
        <path d="M12 4V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 16V20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    close: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  'equipment': {
    barbell: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="11" width="12" height="2" fill={color}/>
        <rect x="4" y="9" width="2" height="6" rx="1" fill={color}/>
        <rect x="18" y="9" width="2" height="6" rx="1" fill={color}/>
        <rect x="2" y="10" width="2" height="4" rx="1" fill={color}/>
        <rect x="20" y="10" width="2" height="4" rx="1" fill={color}/>
      </svg>
    ),
    dumbbell: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="9" y="11" width="6" height="2" fill={color}/>
        <rect x="6" y="9" width="3" height="6" rx="1.5" fill={color}/>
        <rect x="15" y="9" width="3" height="6" rx="1.5" fill={color}/>
        <rect x="4" y="10" width="2" height="4" rx="1" fill={color}/>
        <rect x="18" y="10" width="2" height="4" rx="1" fill={color}/>
      </svg>
    ),
    machine: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="8" width="12" height="8" rx="2" fill={color}/>
        <rect x="8" y="4" width="8" height="4" rx="1" fill={color}/>
        <rect x="8" y="16" width="8" height="4" rx="1" fill={color}/>
        <circle cx="10" cy="12" r="1" fill="white"/>
        <circle cx="14" cy="12" r="1" fill="white"/>
        <rect x="11" y="11" width="2" height="2" fill="white"/>
      </svg>
    ),
    'fixed-bar': (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="11" width="16" height="2" fill={color}/>
        <rect x="3" y="9" width="2" height="6" rx="1" fill={color}/>
        <rect x="19" y="9" width="2" height="6" rx="1" fill={color}/>
        <rect x="8" y="10" width="8" height="4" rx="2" fill={color}/>
        <path d="M10 12H14" stroke="white" strokeWidth="1"/>
      </svg>
    ),
  },
  'actions': {
    play: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M10 8L16 12L10 16V8Z" fill="white"/>
      </svg>
    ),
    pause: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <rect x="9" y="8" width="2" height="8" fill="white"/>
        <rect x="13" y="8" width="2" height="8" fill="white"/>
      </svg>
    ),
    stop: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <rect x="8" y="8" width="8" height="8" rx="1" fill="white"/>
      </svg>
    ),
    timer: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="13" r="9" fill={color}/>
        <path d="M12 7V13L16 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 2H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    calculator: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" fill={color}/>
        <rect x="6" y="4" width="12" height="4" rx="1" fill="white"/>
        <circle cx="8" cy="12" r="1" fill="white"/>
        <circle cx="12" cy="12" r="1" fill="white"/>
        <circle cx="16" cy="12" r="1" fill="white"/>
        <circle cx="8" cy="16" r="1" fill="white"/>
        <circle cx="12" cy="16" r="1" fill="white"/>
        <circle cx="16" cy="16" r="1" fill="white"/>
      </svg>
    ),
    next: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M10 8L14 12L10 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    previous: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M14 8L10 12L14 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    finish: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    delete: (color: string, size: number | string) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color}/>
        <path d="M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
};

const Icon: React.FC<IconProps> = ({ 
  category, 
  name, 
  size = 24, 
  className = '', 
  color = 'currentColor' 
}) => {
  const iconCategory = IconSVGs[category];
  if (!iconCategory) {
    console.warn(`Icon category "${category}" not found`);
    return null;
  }

  const iconRenderer = iconCategory[name as keyof typeof iconCategory];
  if (!iconRenderer) {
    console.warn(`Icon "${name}" not found in category "${category}"`);
    return null;
  }

  return (
    <span className={`inline-block ${className}`} style={{ color }}>
      {iconRenderer(color, size)}
    </span>
  );
};

// Convenience components for each category
export const MuscleGroupIcon: React.FC<Omit<IconProps, 'category'> & { name: MuscleGroupIcon }> = (props) => (
  <Icon category="muscle-groups" {...props} />
);

export const EquipmentIcon: React.FC<Omit<IconProps, 'category'> & { name: EquipmentIcon }> = (props) => (
  <Icon category="equipment" {...props} />
);

export const ActionIcon: React.FC<Omit<IconProps, 'category'> & { name: ActionIcon }> = (props) => (
  <Icon category="actions" {...props} />
);

export const UIIcon: React.FC<Omit<IconProps, 'category'> & { name: UIIcon }> = (props) => (
  <Icon category="ui" {...props} />
);

export default Icon;