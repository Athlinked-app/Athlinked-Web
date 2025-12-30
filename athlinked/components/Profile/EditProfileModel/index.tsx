'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, Camera, Megaphone, Pencil, MapPin, Users, Calendar, UserPlus, MessageCircle } from 'lucide-react';
import EditProfilePopup from '../EditProfilePopup';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  asSidebar?: boolean;
  currentUserId?: string | null;
  viewedUserId?: string | null;
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
  userData,
  onSave,
}: EditProfileModalProps) {
  const router = useRouter();
  const [fetchedUserData, setFetchedUserData] =
    useState<FetchedUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserFromFetch, setCurrentUserFromFetch] = useState<string | null>(null);
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
  const [city, setCity] = useState(userData?.city || '');
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [calculatedAge, setCalculatedAge] = useState<string>('');
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

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch followers count
  const fetchFollowersCount = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/network/counts/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFollowersCount(data.followers || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching followers count:', error);
    }
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
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
          // Store current user ID from fetched data
          if (data.user.id) {
            setCurrentUserFromFetch(data.user.id);
          }
          // Update state with fetched data (prioritize fetched data over props)
          if (data.user.full_name) {
            setFullName(data.user.full_name);
          }
          if (data.user.profile_url) {
            const profileUrl = data.user.profile_url.startsWith('http')
              ? data.user.profile_url
              : `http://localhost:3001${data.user.profile_url}`;
            setProfileImagePreview(profileUrl);
          }
          if (data.user.background_image_url) {
            const bgUrl = data.user.background_image_url.startsWith('http')
              ? data.user.background_image_url
              : `https://qd9ngjg1-3001.inc1.devtunnels.ms${data.user.background_image_url}`;
            setBackgroundImagePreview(bgUrl);
          }
          if (data.user.sports_played) {
            // Parse PostgreSQL array format if needed
            let sportsString = data.user.sports_played;
            if (typeof sportsString === 'string') {
              if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
                sportsString = sportsString.slice(1, -1).replace(/["']/g, '');
              }
              setSportsPlayed(sportsString);
            } else if (Array.isArray(sportsString)) {
              setSportsPlayed(sportsString.join(', '));
            } else {
              setSportsPlayed('');
            }
          }
          if (data.user.primary_sport) {
            setPrimarySport(data.user.primary_sport);
          }
          if (data.user.location) {
            setLocation(data.user.location);
          }
          
          // Calculate age from date of birth
          if (data.user.dob) {
            const dob = new Date(data.user.dob);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              age--;
            }
            setCalculatedAge(age.toString());
            setAge(age.toString());
          } else if (data.user.age) {
            setAge(data.user.age.toString());
            setCalculatedAge(data.user.age.toString());
          }
          
          // Fetch followers count
          if (data.user.id) {
            fetchFollowersCount(data.user.id);
          }
          // Note: bio and education are fetched from profile API, not user API
        }

        // Also fetch profile data if we have user ID and userData prop doesn't have the data
        if (data.success && data.user && data.user.id) {
          // Only fetch if userData prop doesn't already have the data
          const needsProfileData = !userData?.bio && !userData?.education && !userData?.city;
          
          if (needsProfileData) {
            try {
              const profileResponse = await fetch(
                `http://localhost:3001/api/profile/${data.user.id}`
              );
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log(
                  'Fetched profile data in EditProfileModal:',
                  profileData
                );
                // Only set if not already provided via props
                if (!userData?.bio && profileData.bio) setBio(profileData.bio);
                if (!userData?.education && profileData.education) setEducation(profileData.education);
                if (!userData?.city && profileData.city) setCity(profileData.city);
                if (!userData?.profile_url && profileData.profileImage) {
                  const profileUrl = profileData.profileImage.startsWith('http')
                    ? profileData.profileImage
                    : `http://localhost:3001${profileData.profileImage}`;
                  setProfileImagePreview(profileUrl);
                }
                if (!userData?.background_image_url && profileData.coverImage) {
                  const bgUrl = profileData.coverImage.startsWith('http')
                    ? profileData.coverImage
                    : `https://qd9ngjg1-3001.inc1.devtunnels.ms${profileData.coverImage}`;
                  setBackgroundImagePreview(bgUrl);
                }
                if (!userData?.primary_sport && profileData.primarySport) {
                  setPrimarySport(profileData.primarySport);
                }
                if (!userData?.sports_played && profileData.sportsPlayed) {
                  let sportsString = profileData.sportsPlayed;
                  if (typeof sportsString === 'string') {
                    if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
                      sportsString = sportsString.slice(1, -1).replace(/["']/g, '');
                    }
                    setSportsPlayed(sportsString);
                  } else if (Array.isArray(sportsString)) {
                    setSportsPlayed(sportsString.join(', '));
                  }
                }
              }
            } catch (error) {
              console.error(
                'Error fetching profile data in EditProfileModal:',
                error
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data in EditProfileModal:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if userData prop is not provided or incomplete
    if (open && (!userData || !userData.full_name)) {
      fetchUserData();
    } else if (open) {
      // If userData is provided, just set loading to false
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userData]);

  // Update state when userData props change (from parent) - this should take priority
  // This runs after the fetch, so it will override any fetched data
  useEffect(() => {
    if (userData) {
      console.log('EditProfileModal: userData prop changed', userData);
      // Always update these fields when userData changes
      if (userData.full_name !== undefined) setFullName(userData.full_name || '');
      if (userData.username !== undefined) setUsername(userData.username || '');
      if (userData.location !== undefined) setLocation(userData.location || '');
      if (userData.age !== undefined) setAge(userData.age ? userData.age.toString() : '');
      // Always update sports_played, even if empty (to clear it)
      if (userData.sports_played !== undefined) {
        setSportsPlayed(userData.sports_played || '');
      }
      if (userData.primary_sport !== undefined) setPrimarySport(userData.primary_sport || '');
      if (userData.bio !== undefined) setBio(userData.bio || '');
      if (userData.education !== undefined) setEducation(userData.education || '');
      if (userData.city !== undefined) setCity(userData.city || '');
      if (userData.followers_count !== undefined) {
        setFollowersCount(userData.followers_count || 0);
      }
      if (userData.profile_url !== undefined) {
        if (userData.profile_url) {
          const profileUrl = userData.profile_url.startsWith('http')
            ? userData.profile_url
            : `http://localhost:3001${userData.profile_url}`;
          setProfileImagePreview(profileUrl);
        } else {
          setProfileImagePreview(null);
        }
      }
      if (userData.background_image_url !== undefined) {
        if (userData.background_image_url) {
          const bgUrl = userData.background_image_url.startsWith('http')
            ? userData.background_image_url
            : `https://qd9ngjg1-3001.inc1.devtunnels.ms${userData.background_image_url}`;
          setBackgroundImagePreview(bgUrl);
        } else {
          setBackgroundImagePreview(null);
        }
      }
    }
  }, [userData]);

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
    if (data.city) {
      setCity(data.city);
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

  // Calculate completion percentage based on filled fields
  // This recalculates on every render when any field changes
  const calculateCompletion = () => {
    let completed = 0;
    const totalFields = 7;

    // Check each field - must be non-empty
    if (fullName && fullName.trim() !== '') completed++;
    if (username && username.trim() !== '') completed++;
    if (location && location.trim() !== '') completed++;
    if (age && age.trim() !== '') completed++;
    if (sportsPlayed && sportsPlayed.trim() !== '') completed++;
    if (primarySport && primarySport.trim() !== '') completed++;
    if (profileImagePreview) completed++;

    const percentage = Math.min(
      Math.round((completed / totalFields) * 100),
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
              {/* Completion Percentage */}
              <div className="absolute bottom-0 right-0 bg-[#CB9729] text-white text-xs font-semibold rounded-full w-10 h-10 flex items-center justify-center border-2 border-white">
                {currentCompletion}%
              </div>
              {/* Camera Icon */}
              <button
                onClick={handleProfileImageClick}
                className="absolute bottom-0 right-0 bg-gray-200 hover:bg-gray-300 rounded-full p-2.5 border-2 border-white transition-colors"
              >
                <Camera className="w-5 h-5 text-gray-700" />
              </button>
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
                className="text-2xl font-medium text-gray-900 mb-2 w-full border-none focus:outline-none focus:ring-0 bg-transparent"
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

              <div className="flex flex-row gap-3 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-gray-600">
                    {city || location || 'Location'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {followersCount >= 1000 
                      ? `${(followersCount / 1000).toFixed(1)}k followers`
                      : `${followersCount} followers`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-gray-600">
                    {calculatedAge || age || 'Age'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Action Buttons and Sports Information */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-3">
                {/* Show Edit Profile button only if viewing own profile */}
                {(() => {
                  // Determine if viewing own profile
                  const isOwnProfile = !viewedUserId || 
                    (currentUserId && viewedUserId === currentUserId) ||
                    (currentUserFromFetch && viewedUserId === currentUserFromFetch) ||
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
                    {/* Show Connect and Message buttons for other users' profiles */}
                    <button
                      onClick={() => {
                        // TODO: Implement connect functionality
                        console.log('Connect clicked for user:', viewedUserId);
                      }}
                      className="px-6 py-4 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement message functionality
                        console.log('Message clicked for user:', viewedUserId);
                        router.push(`/messages?userId=${viewedUserId}`);
                      }}
                      className="px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </>
                )}
              </div>

              {/* Sports Information */}
              <div className="space-y-1 mt-2">
                <div className="text-md flex items-start">
                  <span className="font-semibold text-gray-900 w-40 text-right flex-shrink-0">Sports Played</span>
                  <span className="mx-3 flex-shrink-0">:</span>
                  <span className="text-gray-700 break-words max-w-xs" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{sportsPlayed || '—'}</span>
                </div>
                <div className="text-md flex items-start">
                  <span className="font-semibold text-gray-900 w-40 text-right flex-shrink-0">Primary Sports</span>
                  <span className="mx-3 flex-shrink-0">:</span>
                  <span className="text-gray-700 break-words max-w-xs">{primarySport || '—'}</span>
                </div>
               
              </div>
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
            city: city,
          }}
          onSave={handleEditPopupSave}
        />
      </div>
    );
  }
}
