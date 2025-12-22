'use client';

import {
  Search,
  Home,
  Play,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  BarChart3,
  Package,
  HelpCircle,
  LogOut,
} from 'lucide-react';

interface NavigationBarProps {
  activeItem?: string;
  userName?: string;
}

export default function NavigationBar({
  activeItem = 'stats',
  userName = 'User',
}: NavigationBarProps) {
  const menuItems = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'clips', icon: Play, label: 'Clips' },
    { id: 'network', icon: Users, label: 'My Network' },
    { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
    { id: 'message', icon: MessageSquare, label: 'Message' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'resource', icon: Package, label: 'Resource' },
    { id: 'help', icon: HelpCircle, label: 'Help & Faq' },
    { id: 'logout', icon: LogOut, label: 'Logout' },
  ];

  // Get display name (first name or provided name)
  const displayName = userName?.split(' ')[0] || 'User';

  return (
    <div className="w-72 bg-white flex flex-col border-r border-gray-200">
      {/* Athlete Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-600 mb-2 font-medium">Athlete</div>
          <div className="w-16 h-16 rounded-full bg-gray-300 mb-2 overflow-hidden border-2 border-gray-400">
            <img
              src="https://via.placeholder.com/64"
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="font-bold text-gray-900 text-base">{displayName}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <a
                  href={
                    item.id === 'stats'
                      ? '/stats'
                      : item.id === 'clips'
                        ? '/clips'
                        : '#'
                  }
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
