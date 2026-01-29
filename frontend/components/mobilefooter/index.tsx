'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Play, Users, User } from 'lucide-react';

const navItems = [
  { id: 'home', href: '/home', icon: Home, label: 'Home' },
  { id: 'search', href: '/search', icon: Search, label: 'Search' },
  { id: 'clips', href: '/clips', icon: Play, label: 'Clips' },
  { id: 'network', href: '/network', icon: Users, label: 'Network' },
  { id: 'profile', href: '/profile', icon: User, label: 'Profile' },
] as const;

export default function MobileFooter() {
  const pathname = usePathname() ?? '';
  const isClipsPage = pathname.startsWith('/clips');

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.06)] ${
        isClipsPage ? 'bg-black' : 'bg-white'
      }`}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      aria-label="Mobile navigation"
    >
      <nav className="flex items-center justify-around px-2 pt-3">
        {navItems.map(({ id, href, icon: Icon, label }) => {
          const isActive =
            id === 'home'
              ? pathname === '/home' || pathname === '/'
              : pathname.startsWith(href);
          const colorClass = isClipsPage
            ? isActive
              ? 'text-amber-500'
              : 'text-white'
            : isActive
              ? 'text-amber-500'
              : 'text-gray-400';

          return (
            <Link
              key={id}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-colors active:opacity-80 ${colorClass}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-6 h-6"
                strokeWidth={isActive && !isClipsPage ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
