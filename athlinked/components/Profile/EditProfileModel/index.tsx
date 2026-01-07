'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronLeft,
  Camera,
  Megaphone,
  Pencil,
  MapPin,
  Users,
  Calendar,
  UserPlus,
  MessageCircle,
  Heart,
} from 'lucide-react';
import EditProfilePopup from '../EditProfilePopup';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  asSidebar?: boolean;
  currentUserId?: string | null;
  viewedUserId?: string | null;
  connectionRequestStatus?: {
    exists: boolean;
    status: string | null;
  } | null;
  onSendConnectionRequest?: () => void;
  userData?: {
    full_name?: string;
    username?: string;
    profile_url?: string | null;
    user_type?: string;
    location?: string;
    age?: number;
    followers_count?: number;
    sports_played?: string;
    primary_sport?: string;
    profile_completion?: number;
    background_image_url?: string | null;
    bio?: string;
    education?: string;
    city?: string;
  };
  profileSections?: {
    bio?: string;
    socialHandles?: any[];
    academicBackgrounds?: any[];
    achievements?: any[];
    athleticAndPerformance?: any[];
    competitionAndClubs?: any[];
    characterAndLeadership?: any[];
    healthAndReadiness?: any[];
    videoAndMedia?: any[];
  };
  onSave?: (data: {
    full_name?: string;
    username?: string;
    location?: string;
    age?: number;
    sports_played?: string;
    primary_sport?: string;
    profile_url?: File;
    background_image_url?: File;
    bio?: string;
    education?: string;
    city?: string;
  }) => void;
}

interface FetchedUserData {
  id?: string;
  full_name?: string;
  username?: string;
  profile_url?: string | null;
  user_type?: string;
  location?: string;
  age?: number;
  sports_played?: string;
  primary_sport?: string;
  background_image_url?: string | null;
}

export default function EditProfileModal({
  open,
  onClose,
  asSidebar = false,
  currentUserId,
  viewedUserId,
  connectionRequestStatus,
  onSendConnectionRequest,
  userData,
  profileSections,
  onSave,
}: EditProfileModalProps) {
  const router = useRouter();
  const [fetchedUserData, setFetchedUserData] =
    useState<FetchedUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState(userData?.full_name || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [location, setLocation] = useState(userData?.location || '');
  const [age, setAge] = useState(userData?.age?.toString() || '');
  const [sportsPlayed, setSportsPlayed] = useState(
    userData?.sports_played || ''
  );
  const [primarySport, setPrimarySport] = useState(
    userData?.primary_sport || ''
  );
  const [bio, setBio] = useState(userData?.bio || '');
  const [education, setEducation] = useState(userData?.education || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    userData?.profile_url || null
  );
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<
    string | null
  >(userData?.background_image_url || null);
  const [profileCompletion, setProfileCompletion] = useState(
    userData?.profile_completion || 60
  );
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data from API - only for current user, not when viewing another user
  useEffect(() => {
    const fetchUserData = async () => {
      // If viewing another user's profile, don't fetch current user data
      // Rely on userData prop instead
      if (viewedUserId && viewedUserId !== currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          setLoading(false);
          return;
        }

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success && data.user) {
          setFetchedUserData(data.user);
          // Set current user type from fetched data
          if (data.user.user_type) {
            setCurrentUserType(data.user.user_type);
          }
          // Only update state if userData prop is not provided or if it's our own profile
          if (!userData || !viewedUserId || viewedUserId === currentUserId) {
            if (data.user.full_name) {
              setFullName(data.user.full_name);
            }
            if (data.user.profile_url) {
              const profileUrl = data.user.profile_url.startsWith('http')
                ? data.user.profile_url
                : `https://qd9ngjg1-3001.inc1.devtunnels.ms${data.user.profile_url}`;
              setProfileImagePreview(profileUrl);
            }
            if (data.user.background_image_url) {
              const bgUrl = data.user.background_image_url.startsWith('http')
                ? data.user.background_image_url
                : `https://qd9ngjg1-3001.inc1.devtunnels.ms${data.user.background_image_url}`;
              setBackgroundImagePreview(bgUrl);
            }
            if (data.user.sports_played) {
              setSportsPlayed(data.user.sports_played);
            }
            if (data.user.primary_sport) {
              setPrimarySport(data.user.primary_sport);
            }
            if (data.user.location) {
              setLocation(data.user.location);
            }
            if (data.user.age) {
              setAge(data.user.age.toString());
            }
          }
          // Note: bio and education are fetched from profile API, not user API
        }

        // Also fetch profile data if we have user ID (only for own profile)
        if (
          data.success &&
          data.user &&
          data.user.id &&
          (!viewedUserId || viewedUserId === currentUserId)
        ) {
          try {
            const { apiGet } = await import('@/utils/api');
            const profileData = await apiGet<{
              bio?: string | null;
              education?: string | null;
              city?: string | null;
              profileImage?: string | null;
              coverImage?: string | null;
              primarySport?: string | null;
              sportsPlayed?: string | null;
            }>(`/profile/${data.user.id}`);

            if (profileData.bio) setBio(profileData.bio);
            if (profileData.education) setEducation(profileData.education);
            if (profileData.city) setLocation(profileData.city);
            if (profileData.profileImage) {
              const profileUrl = profileData.profileImage.startsWith('http')
                ? profileData.profileImage
                : `https://qd9ngjg1-3001.inc1.devtunnels.ms${profileData.profileImage}`;
              setProfileImagePreview(profileUrl);
            }
            if (profileData.coverImage) {
              const bgUrl = profileData.coverImage.startsWith('http')
                ? profileData.coverImage
                : `https://qd9ngjg1-3001.inc1.devtunnels.ms${profileData.coverImage}`;
              setBackgroundImagePreview(bgUrl);
            }
            if (profileData.primarySport) {
              setPrimarySport(profileData.primarySport);
              setSportsPlayed(profileData.primarySport);
            }
          } catch (error) {
            console.error(
              'Error fetching profile data in EditProfileModal:',
              error
            );
          }
        }
      } catch (error) {
        console.error('Error fetching user data in EditProfileModal:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewedUserId, currentUserId]);

  // Check favorite status when viewing an athlete profile as a coach
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (
        !open ||
        !currentUserId ||
        !viewedUserId ||
        currentUserId === viewedUserId
      ) {
        setIsFavorite(false);
        return;
      }

      // Fetch current user data to check user type
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          setIsFavorite(false);
          return;
        }

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (response.ok) {
          const data = await response.json();
          const fetchedCurrentUserType = data.user?.user_type;
          setCurrentUserType(fetchedCurrentUserType || null);
          const viewedUserType = userData?.user_type;

          if (
            fetchedCurrentUserType === 'coach' &&
            viewedUserType === 'athlete'
          ) {
            try {
              const { apiGet } = await import('@/utils/api');
              const result = await apiGet<{
                success: boolean;
                isFavorite: boolean;
              }>(`/favorites/${viewedUserId}/status`);
              if (result.success) {
                setIsFavorite(result.isFavorite);
              }
            } catch (error) {
              console.error('Error checking favorite status:', error);
            }
          } else {
            setIsFavorite(false);
          }
        } else {
          setCurrentUserType(null);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('Error fetching current user for favorite check:', error);
        setCurrentUserType(null);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [open, currentUserId, viewedUserId, userData]);

  // Update state when userData props change (from parent)
  // This should take priority when viewing another user's profile
  useEffect(() => {
    if (userData) {
      // When viewing another user, always use userData prop
      // When viewing own profile, userData prop should also take priority
      if (userData.full_name !== undefined)
        setFullName(userData.full_name || '');
      if (userData.username !== undefined) setUsername(userData.username || '');
      // Prioritize city over location if both are provided
      if (userData.city !== undefined) {
        setLocation(userData.city || '');
      } else if (userData.location !== undefined) {
        setLocation(userData.location || '');
      }
      if (userData.age !== undefined) setAge(userData.age?.toString() || '');
      // Always update sports_played, even if empty (to clear it)
      if (userData.sports_played !== undefined) {
        setSportsPlayed(userData.sports_played || '');
      }
      if (userData.primary_sport !== undefined)
        setPrimarySport(userData.primary_sport || '');
      if (userData.bio !== undefined) setBio(userData.bio || '');
      if (userData.education !== undefined)
        setEducation(userData.education || '');
      // Profile image - prioritize userData prop, especially when viewing another user
      if (userData.profile_url !== undefined) {
        const profileUrl = userData.profile_url
          ? userData.profile_url.startsWith('http')
            ? userData.profile_url
            : `https://qd9ngjg1-3001.inc1.devtunnels.ms${userData.profile_url}`
          : null;
        setProfileImagePreview(profileUrl);
      }
      // Background image - prioritize userData prop, especially when viewing another user
      if (userData.background_image_url !== undefined) {
        const bgUrl = userData.background_image_url
          ? userData.background_image_url.startsWith('http')
            ? userData.background_image_url
            : `https://qd9ngjg1-3001.inc1.devtunnels.ms${userData.background_image_url}`
          : null;
        setBackgroundImagePreview(bgUrl);
      }
    }
  }, [userData, viewedUserId]);

  const handleBackToHome = () => {
    router.push('/home');
  };

  if (!open) return null;

  const handleProfileImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      // Update completion percentage
      if (!profileImagePreview) {
        setProfileCompletion(prev => Math.min(prev + 10, 100));
      }
    }
  };

  const handleBackgroundImageSelect = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      setBackgroundImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleBackgroundImageClick = () => {
    backgroundImageInputRef.current?.click();
  };

  const handleToggleFavorite = async () => {
    if (!currentUserId || !viewedUserId || currentUserId === viewedUserId) {
      return;
    }

    setFavoriteLoading(true);
    try {
      const { apiPost, apiDelete } = await import('@/utils/api');

      if (isFavorite) {
        const result = await apiDelete<{
          success: boolean;
          isFavorite: boolean;
        }>(`/favorites/${viewedUserId}`);
        if (result.success) {
          setIsFavorite(false);
        }
      } else {
        const result = await apiPost<{
          success: boolean;
          isFavorite: boolean;
        }>(`/favorites/${viewedUserId}`, {});
        if (result.success) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        full_name: fullName,
        username: username,
        location: location,
        age: age ? parseInt(age) : undefined,
        sports_played: sportsPlayed,
        primary_sport: primarySport,
        profile_url: profileImage || undefined,
        background_image_url: backgroundImage || undefined,
      });
    }
    onClose();
  };

  const handleEditProfileClick = () => {
    setShowEditPopup(true);
  };

  const handleEditPopupSave = (data: {
    profile_url?: File;
    background_image_url?: File;
    sports_played?: string;
    education?: string;
    city?: string;
    bio?: string;
  }) => {
    // Update local state with the saved data
    if (data.profile_url) {
      setProfileImage(data.profile_url);
      setProfileImagePreview(URL.createObjectURL(data.profile_url));
    }
    if (data.background_image_url) {
      setBackgroundImage(data.background_image_url);
      setBackgroundImagePreview(URL.createObjectURL(data.background_image_url));
    }
    if (data.sports_played) {
      setSportsPlayed(data.sports_played);
    }
    if (data.bio) {
      setBio(data.bio);
    }
    if (data.city !== undefined) {
      setLocation(data.city);
    }
    // Call parent onSave if provided
    if (onSave) {
      onSave({
        profile_url: data.profile_url,
        background_image_url: data.background_image_url,
        sports_played: data.sports_played,
        bio: data.bio !== undefined ? data.bio : undefined,
        education: data.education !== undefined ? data.education : undefined,
        city: data.city !== undefined ? data.city : undefined,
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate completion percentage based on all profile sections
  // This recalculates on every render when any field changes
  const calculateCompletion = () => {
    let completed = 0;
    const totalSections = 12; // Total number of profile sections

    // Basic Profile Information (3 sections)
    if (fullName && fullName.trim() !== '') completed++;
    if (profileImagePreview) completed++;
    if ((location && location.trim() !== '') || (age && age.trim() !== ''))
      completed++;

    // Profile Sections (9 sections)
    if (profileSections?.bio && profileSections.bio.trim() !== '') completed++;
    if (
      profileSections?.socialHandles &&
      profileSections.socialHandles.length > 0
    )
      completed++;
    if (
      profileSections?.academicBackgrounds &&
      profileSections.academicBackgrounds.length > 0
    )
      completed++;
    if (
      profileSections?.achievements &&
      profileSections.achievements.length > 0
    )
      completed++;
    if (
      profileSections?.athleticAndPerformance &&
      profileSections.athleticAndPerformance.length > 0
    )
      completed++;
    if (
      profileSections?.competitionAndClubs &&
      profileSections.competitionAndClubs.length > 0
    )
      completed++;
    if (
      profileSections?.characterAndLeadership &&
      profileSections.characterAndLeadership.length > 0
    )
      completed++;
    if (
      profileSections?.healthAndReadiness &&
      profileSections.healthAndReadiness.length > 0
    )
      completed++;
    if (
      profileSections?.videoAndMedia &&
      profileSections.videoAndMedia.length > 0
    )
      completed++;

    const percentage = Math.min(
      Math.round((completed / totalSections) * 100),
      100
    );
    return percentage;
  };

  // Calculate completion percentage - this will recalculate on every render when fields change
  const currentCompletion = calculateCompletion();

  // Calculate the circumference for the progress ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Calculate offset: when completion is 0%, offset = full circumference (no fill)
  // When completion is 100%, offset = 0 (fully filled)
  const offset = circumference - (currentCompletion / 100) * circumference;

  if (!open) return null;

  // Sidebar view
  if (asSidebar) {
    return (
      <div className="w-full  bg-white overflow-y-auto rounded-lg">
        {/* Background Image */}
        <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
          {/* Back Button - Positioned on left side above the image */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 transition-colors text-gray-700 shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </div>

          {backgroundImagePreview ? (
            <div className="absolute inset-0 w-full h-full">
              <img
                src={backgroundImagePreview}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center"></div>
          )}

          <input
            ref={backgroundImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageSelect}
            className="hidden"
          />
        </div>

        {/* Profile Section */}
        <div className={`relative ${asSidebar ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
          <div className="relative -mt-16 mb-4 flex justify-start px-6">
            <div className="relative">
              <svg
                className={`${asSidebar ? 'w-32 h-32' : 'w-40 h-40'} transform -rotate-90`}
                viewBox="0 0 120 120"
              >
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="#CB9729"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-in-out"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`${asSidebar ? 'w-28 h-28 border-2' : 'w-36 h-36 border-4'} rounded-full overflow-hidden border-white bg-gray-200`}
                >
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-2xl font-semibold text-gray-600">
                        {getInitials(fullName || 'User')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Completion Percentage Circle */}
              <div className="absolute bottom-0 right-0 bg-[#CB9729] text-white text-sm font-bold rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-lg">
                {currentCompletion}%
              </div>
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Details and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 px-8">
            {/* Left Column - Profile Details */}
            <div className="flex-1">
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full Name"
                className="text-2xl font-medium text-black mb-2 w-full border-none focus:outline-none focus:ring-0 bg-transparent placeholder:text-gray-400"
              />
              <p className="text-lg text-gray-600 mb-4">
                {(() => {
                  const userType =
                    fetchedUserData?.user_type || userData?.user_type;
                  return userType === 'coach'
                    ? 'Coach'
                    : userType === 'organization'
                      ? 'Organization'
                      : 'Athlete';
                })()}
              </p>

              <div className="flex flex-row items-center gap-3 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Location"
                    className="border-none focus:outline-none focus:ring-0 bg-transparent text-gray-600 placeholder:text-gray-400"
                    style={{
                      width: location
                        ? `${Math.max(location.length * 7 + 16, 60)}px`
                        : '60px',
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {userData?.followers_count !== undefined
                      ? userData.followers_count.toLocaleString()
                      : '0'}{' '}
                    followers
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Age"
                    className="border-none focus:outline-none focus:ring-0 bg-transparent text-gray-600 placeholder:text-gray-400"
                    style={{
                      width: age
                        ? `${Math.max(age.length * 7 + 8, 35)}px`
                        : '35px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Action Buttons and Sports Information */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-3">
                {/* Show Edit Profile button only if viewing own profile */}
                {(() => {
                  // Determine if viewing own profile
                  const isOwnProfile =
                    !viewedUserId ||
                    (currentUserId && viewedUserId === currentUserId) ||
                    (!viewedUserId && !currentUserId); // If no viewedUserId, assume own profile
                  return isOwnProfile;
                })() ? (
                  <button
                    onClick={handleEditProfileClick}
                    className="px-12 py-4 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (
                          onSendConnectionRequest &&
                          connectionRequestStatus?.status !== 'connected'
                        ) {
                          onSendConnectionRequest();
                        }
                      }}
                      disabled={
                        (connectionRequestStatus?.exists &&
                          connectionRequestStatus?.status === 'pending') ||
                        connectionRequestStatus?.status === 'connected'
                      }
                      className={`px-6 py-4 rounded-lg transition-colors flex items-center gap-2 ${
                        connectionRequestStatus?.status === 'connected'
                          ? 'bg-white border border-[#CB9729] text-[#CB9729]  cursor-default'
                          : connectionRequestStatus?.exists &&
                              connectionRequestStatus?.status === 'pending'
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-[#CB9729] text-white hover:bg-[#b78322]'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {connectionRequestStatus?.status === 'connected'
                          ? 'Connected'
                          : connectionRequestStatus?.exists &&
                              connectionRequestStatus?.status === 'pending'
                            ? 'Pending'
                            : 'Connect'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/messages?userId=${viewedUserId}`);
                      }}
                      className="px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                    {/* Show Favourites button only if coach viewing athlete */}
                    {(() => {
                      const userType =
                        currentUserType || fetchedUserData?.user_type;
                      const viewedUserType = userData?.user_type;
                      return (
                        userType === 'coach' && viewedUserType === 'athlete'
                      );
                    })() && (
                      <button
                        onClick={handleToggleFavorite}
                        disabled={favoriteLoading}
                        className={`px-6 py-4 rounded-lg transition-colors flex items-center gap-2 ${
                          isFavorite
                            ? 'bg-[#CB9729] text-white hover:bg-red-600'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                        />
                        <span>Favourites</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Sports Information */}
              {(() => {
                const userType =
                  fetchedUserData?.user_type || userData?.user_type;
                return userType === 'athlete' ? (
                  <div className="space-y-1 mt-2">
                    <div className="text-md flex">
                      <span className="font-semibold text-gray-900 w-40 text-right">
                        Sports Played
                      </span>
                      <span className="mx-3">:</span>
                      <span className="text-gray-700">
                        {sportsPlayed || '—'}
                      </span>
                    </div>
                    <div className="text-md flex">
                      <span className="font-semibold text-gray-900 w-40 text-right">
                        Primary Sports
                      </span>
                      <span className="mx-3">:</span>
                      <span className="text-gray-700">
                        {primarySport || '—'}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Edit Profile Popup */}
        <EditProfilePopup
          open={showEditPopup}
          onClose={() => setShowEditPopup(false)}
          userData={{
            full_name: fullName,
            profile_url: profileImagePreview,
            background_image_url: backgroundImagePreview,
            sports_played: sportsPlayed,
            bio: bio,
            education: education,
            city: location,
          }}
          onSave={handleEditPopupSave}
        />
      </div>
    );
  }
}
