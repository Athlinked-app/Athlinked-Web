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
  userProfileUrl?: string;
  userRole?: string;
}

export default function NavigationBar({
  activeItem = 'stats',
  userName = 'User',
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
  userRole = 'Athlete',
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
    <div className="w-72 bg-white flex flex-col border-r border-gray-200 rounded-lg">
      {/* Athlete Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-gray-300 overflow-hidden border border-gray-200">
            <img
              src={userProfileUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm text-gray-500">{userRole}</span>
            <span className="text-xl font-semibold text-gray-900">
              {displayName}
            </span>
          </div>
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
                    item.id === 'home'
                      ? '/home'
                      : item.id === 'stats'
                        ? '/stats'
                        : item.id === 'clips'
                          ? '/clips'
                          : '#'
                  }
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#F5F5F5] text-[#CB9729]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="text-md font-medium">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
