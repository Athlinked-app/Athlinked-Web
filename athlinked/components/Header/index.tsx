'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type HeaderProps = {
  userName?: string;
  userProfileUrl?: string;
};

interface UserData {
  full_name: string | null;
  username: string | null;
  profile_url?: string;
}

export default function Header({
  userName: propUserName,
  userProfileUrl: propUserProfileUrl,
}: HeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (propUserName && propUserName !== 'User' && propUserProfileUrl && propUserProfileUrl !== '/assets/Header/profiledummy.jpeg') {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (!response.ok) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.user && isMounted) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data in Header:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [propUserName, propUserProfileUrl]);

  const userName = propUserName || userData?.full_name || 'User';
  
  const rawProfileUrl = propUserProfileUrl || (userData?.profile_url && typeof userData.profile_url === 'string' && userData.profile_url.trim() !== '' ? userData.profile_url : null);
  
  const userProfileUrl = rawProfileUrl && rawProfileUrl.trim() !== ''
    ? (rawProfileUrl.startsWith('http') 
        ? rawProfileUrl 
        : rawProfileUrl.startsWith('/') && !rawProfileUrl.startsWith('/assets')
          ? `http://localhost:3001${rawProfileUrl}`
          : rawProfileUrl)
    : null;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="flex items-center justify-between px-3 md:px-8 py-4 bg-white">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/Homescreen/Logo.png"
            alt="ATHLINKED Logo"
            width={180}
            height={50}
            className="w-32 h-8 md:w-[200px] md:h-[50px]"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center">
       
        <div className="ml-2">
          {userProfileUrl ? (
            <Image
              src={userProfileUrl}
              alt={`${userName} profile avatar`}
              width={48}
              height={48}
              className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover border border-gray-200"
              priority
            />
          ) : (
            <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xs md:text-base">
                {getInitials(userName)}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}