'use client';

import React from 'react';

// Define available icon categories and names
export type IconCategory = 'muscle-groups' | 'equipment' | 'actions' | 'ui';

export type MuscleGroupIcon = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core' | 'calves';
export type EquipmentIcon = 'barbell' | 'dumbbell' | 'machine' | 'fixed-bar';
export type ActionIcon = 'play' | 'pause' | 'stop' | 'timer' | 'calculator' | 'next' | 'previous' | 'finish' | 'delete';
export type UIIcon = 'calendar' | 'checkmark' | 'settings' | 'workout' | 'templates' | 'history' | 'progress' | 'exercises' | 'close';

export type IconName = MuscleGroupIcon | EquipmentIcon | ActionIcon | UIIcon;

interface IconProps {
  category: IconCategory;
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ 
  category, 
  name, 
  size = 24, 
  className = '', 
  color = 'currentColor' 
}) => {
  const iconPath = `/icons/${category}/${name}.svg`;
  
  return (
    <img
      src={iconPath}
      alt={`${name} icon`}
      width={size}
      height={size}
      className={`block ${className}`}
      style={{ 
        filter: color !== 'currentColor' ? `none` : undefined,
        color: color === 'currentColor' ? undefined : color
      }}
    />
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