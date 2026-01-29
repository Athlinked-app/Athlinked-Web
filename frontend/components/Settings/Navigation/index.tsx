'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  UserCog,
  Eye,
  ShieldAlert,
  Sliders,
  Shield,
  Users,
  FileText,
  Trash2,
  X,
} from 'lucide-react';
import { apiDelete } from '@/utils/api';
import { logout, getCurrentUser } from '@/utils/auth';

interface SettingsNavigationProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

export default function SettingsNavigation({
  activeItem,
  onItemClick,
}: SettingsNavigationProps) {
  const router = useRouter();

  const menuItems = [
    { id: 'personal-info', icon: UserCog, label: 'Personal Information' },
    { id: 'security', icon: Eye, label: 'Security & Sign in' },
    { id: 'visibility', icon: ShieldAlert, label: 'Visibility' },
    { id: 'preferences', icon: Sliders, label: 'Preferences' },
    { id: 'privacy-policy', icon: Shield, label: 'Privacy Policy' },
    { id: 'about', icon: Users, label: 'About us' },
    { id: 'terms', icon: FileText, label: 'Terms & Service' },
  ];

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  // Fetch current user email when modal opens

  const handleDeleteAccount = () => {
    router.push('/delete-account');
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 mb-4 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-700" />
          <span className="text-md font-medium text-gray-700">Back</span>
        </button>

        {/* Settings Title */}
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id; // Highlight based on activeItem prop

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-yellow-50 hover:bg-yellow-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-[#CB9729]' : 'text-gray-600'}
              />
              <span
                className={`text-base font-medium ${
                  isActive ? 'text-[#CB9729]' : 'text-gray-900'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Delete Account Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          <span className="text-base font-medium">Delete Account</span>
        </button>
      </div>

      {/* Delete Account Modal */}
    </div>
  );
}
