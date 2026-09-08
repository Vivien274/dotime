import React from 'react'
import {
  Briefcase,
  Dumbbell,
  User,
  BookOpen,
  Code2,
  Coffee,
  Heart,
  Music,
  Gamepad2,
  Tv,
  Utensils,
  Plane,
  Palette,
  Sparkles,
  Zap,
  Activity as ActivityIcon,
  Users,
  Video,
  PenTool,
  Layout,
  Globe,
  Moon,
  type LucideProps,
} from 'lucide-react'


export const AVAILABLE_ICONS: Record<string, React.FC<LucideProps>> = {
  Briefcase,
  Dumbbell,
  User,
  BookOpen,
  Code2,
  Coffee,
  Heart,
  Music,
  Gamepad2,
  Tv,
  Utensils,
  Plane,
  Palette,
  Sparkles,
  Zap,
  Activity: ActivityIcon,
  Users,
  Video,
  PenTool,
  Layout,
  Globe,
  Moon,
}



interface IconRendererProps extends LucideProps {
  name: string
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  const IconComponent = AVAILABLE_ICONS[name] || AVAILABLE_ICONS['Sparkles'] || Sparkles
  return <IconComponent {...props} />
}
