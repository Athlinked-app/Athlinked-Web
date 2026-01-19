'use client';

import { useState, useEffect } from 'react';
import { X, Bookmark } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import CampDetailsPopup from '@/components/opportunities/CampDetailsPopup';
import SaveModal from '@/components/Save/SaveModal';
import { apiGet } from '@/utils/api';
import { getResourceUrl } from '@/utils/config';

type TabType = 'all' | 'tryouts' | 'scholarships' | 'tournaments';

interface OpportunityItem {
  id: string;
  category: string;
  title: string;
  sport?: string; // Add sport field
  website?: string; // Add website field
  image: string;
  link?: string;
  type: 'tryouts' | 'scholarship' | 'tournament';
  date?: string;
  location?: string;
  eligibility?: string;
  mustRepresent?: string;
  dates?: string;
  venue?: string;
  format?: string;
  matchDetails?: string;
  registrationDeadline?: string;
  membershipFee?: string;
  documentsRequired?: string;
}

interface CampDetails {
  title: string;
  image: string;
  date: string;
  location: string;
  description: string;
  applyLink: string;
}

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<OpportunityItem | null>(null);
  const [showCampPopup, setShowCampPopup] = useState(false);
  const [campDetails, setCampDetails] = useState<CampDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [scrapedCamps, setScrapedCamps] = useState<OpportunityItem[]>([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState<{
    [key: string]: boolean;
  }>({});
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');
  const [saveAlertOpportunityId, setSaveAlertOpportunityId] = useState<
    string | null
  >(null);
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    profile_url?: string;
  } | null>(null);

  const staticOpportunities: OpportunityItem[] = [
    // SCHOLARSHIPS
    {
      id: '2',
      category: 'Scholarship',
      title: 'Silver Creek Scholarship',
      image:
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop',
      type: 'scholarship',
      eligibility: 'High school seniors with GPA above 3.5',
      mustRepresent: 'Must be enrolled in high school',
      dates: 'Applications open until August 31, 2025',
      venue: 'Online Application',
      format: 'Essay submission and interview',
      matchDetails: 'N/A',
      registrationDeadline: 'August 31, 2025',
      membershipFee: 'Free',
      documentsRequired: 'Transcripts, recommendation letters, essay',
    },
    {
      id: '6',
      category: 'Scholarship',
      title: 'Trine University Athletic Scholarship',
      image:
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&h=100&fit=crop',
      type: 'scholarship',
      eligibility: 'International students with SAT scores above 1200',
      mustRepresent: 'Must apply through official portal',
      dates: 'Rolling admissions',
      venue: 'Trine University, USA',
      format: 'Application review and interview',
      matchDetails: 'N/A',
      registrationDeadline: 'December 15, 2025',
      membershipFee: 'Application fee: $50',
      documentsRequired: 'SAT scores, transcripts, essays, recommendations',
    },
    {
      id: '7',
      category: 'Scholarship',
      title: 'Stanford Athletic Excellence Scholarship',
      image:
        'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop',
      type: 'scholarship',
      eligibility: 'High achieving students with athletic excellence',
      mustRepresent: 'Must demonstrate leadership',
      dates: 'Early decision: November 1, 2025',
      venue: 'Stanford University, California',
      format: 'Holistic review process',
      matchDetails: 'N/A',
      registrationDeadline: 'November 1, 2025',
      membershipFee: 'Application fee: $90',
      documentsRequired: 'Common App, essays, test scores, athletic portfolio',
    },
    {
      id: '8',
      category: 'Scholarship',
      title: 'National Athletic Merit Award',
      image:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop',
      type: 'scholarship',
      eligibility: 'Varsity athletes with 3.0+ GPA',
      mustRepresent: 'Must be currently competing at varsity level',
      dates: 'Application period: January 1 - March 31, 2025',
      venue: 'Online Application',
      format: 'Portfolio submission and coach recommendations',
      matchDetails: 'N/A',
      registrationDeadline: 'March 31, 2025',
      membershipFee: 'Free',
      documentsRequired:
        'Transcripts, coach letter, highlight reel, personal statement',
    },
    {
      id: '9',
      category: 'Scholarship',
      title: 'State University Sports Scholarship',
      image:
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=100&h=100&fit=crop',
      type: 'scholarship',
      eligibility: 'State residents, athletes aged 17-19',
      mustRepresent: 'Must maintain 2.5+ GPA',
      dates: 'Apply by June 1, 2025',
      venue: 'State University Campus',
      format: 'Tryout and academic review',
      matchDetails: 'N/A',
      registrationDeadline: 'June 1, 2025',
      membershipFee: 'Free for state residents',
      documentsRequired: 'Proof of residency, transcripts, sports achievements',
    },

    // TOURNAMENTS
    {
      id: '3',
      category: 'Tournament',
      title: 'Golden State Championship',
      image:
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=100&h=100&fit=crop',
      type: 'tournament',
      eligibility: 'Players aged 16-21',
      mustRepresent: 'Must be part of a registered team',
      dates: 'September 10 - September 17, 2025',
      venue: 'Golden Sports Complex, Mumbai',
      format: 'Knockout rounds followed by finals',
      matchDetails: 'Standard tournament rules apply',
      registrationDeadline: 'August 15, 2025',
      membershipFee: '₹7,500 per team',
      documentsRequired: 'ID proof, team registration, medical clearance',
    },
    {
      id: '4',
      category: 'Tournament',
      title: 'Palmetto Basketball Invitational',
      image:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=100&h=100&fit=crop',
      type: 'tournament',
      eligibility: 'College athletes only',
      mustRepresent: 'Must represent a college team',
      dates: 'October 5 - October 12, 2025',
      venue: 'Palmetto Arena, Hyderabad',
      format: 'Round-robin then playoffs',
      matchDetails: 'NCAA rules, 4 quarters, 12 mins each',
      registrationDeadline: 'September 1, 2025',
      membershipFee: '₹8,000 per team',
      documentsRequired: 'College ID, age proof, medical fitness',
    },
    {
      id: '10',
      category: 'Tournament',
      title: 'National Youth Soccer Cup',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop',
      type: 'tournament',
      eligibility: 'Youth teams U-18',
      mustRepresent: 'Must represent registered youth club',
      dates: 'July 20 - July 28, 2025',
      venue: 'National Stadium, Delhi',
      format: 'Group stage, quarter-finals, semi-finals, finals',
      matchDetails: 'FIFA youth rules, 2x35 minute halves',
      registrationDeadline: 'June 15, 2025',
      membershipFee: '₹6,000 per team',
      documentsRequired: 'Birth certificates, club registration, player cards',
    },
    {
      id: '11',
      category: 'Tournament',
      title: 'East Coast Volleyball Championship',
      image:
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=100&h=100&fit=crop',
      type: 'tournament',
      eligibility: 'High school and club teams',
      mustRepresent: 'Team must be registered',
      dates: 'November 15 - November 22, 2025',
      venue: 'Coastal Sports Arena, Chennai',
      format: 'Pool play followed by bracket',
      matchDetails: 'Best of 5 sets, rally scoring',
      registrationDeadline: 'October 20, 2025',
      membershipFee: '₹5,500 per team',
      documentsRequired: 'Team roster, school/club letter, insurance proof',
    },
    {
      id: '12',
      category: 'Tournament',
      title: 'Winter Tennis Open',
      image:
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100&h=100&fit=crop',
      type: 'tournament',
      eligibility: 'Singles and doubles, all skill levels',
      mustRepresent: 'Individual or club registration',
      dates: 'December 1 - December 8, 2025',
      venue: 'Premium Tennis Courts, Bangalore',
      format: 'Single elimination bracket',
      matchDetails: 'Best of 3 sets, standard ITF rules',
      registrationDeadline: 'November 10, 2025',
      membershipFee: '₹2,000 singles, ₹3,500 doubles',
      documentsRequired:
        'ID proof, medical certificate, club membership (if applicable)',
    },
  ];

  const [opportunities, setOpportunities] =
    useState<OpportunityItem[]>(staticOpportunities);


useEffect(() => {
  const fetchAllCamps = async () => {
    console.log('🔍 Starting to fetch camps from all sources...');
    setLoadingCamps(true);
    try {
      // Fetch from only two sources: Play N Sports and Lax Camps
      const [playNSportsResponse, laxCampsResponse] = await Promise.all([
        fetch('/api/scrape-camps'),
        fetch('/api/scrape-laxcamps'),
      ]);

      const [playNSportsData, laxCampsData] = await Promise.all([
        playNSportsResponse.json(),
        laxCampsResponse.json(),
      ]);

      console.log('📦 Play N Sports data:', playNSportsData);
      console.log('📦 Lax Camps data:', laxCampsData);

      // Combine only the two scraped sources
      const allScrapedCamps = [
        ...(playNSportsData.success && playNSportsData.camps
          ? playNSportsData.camps
          : []),
        ...(laxCampsData.success && laxCampsData.camps
          ? laxCampsData.camps
          : []),
      ];

      console.log('✅ Total scraped camps:', allScrapedCamps.length);
      setScrapedCamps(allScrapedCamps);
    } catch (error) {
      console.error('❌ Error fetching camps:', error);
    } finally {
      setLoadingCamps(false);
      console.log('✅ Finished loading camps');
    }
  };

  fetchAllCamps();
}, []);


  const allOpportunities = [...opportunities, ...scrapedCamps];

  // Check saved status for opportunities
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          return;
        }

        let data;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{
            success: boolean;
            user?: {
              full_name?: string;
              profile_url?: string;
            };
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          data = await apiGet<{
            success: boolean;
            user?: {
              full_name?: string;
              profile_url?: string;
            };
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (data.success && data.user) {
          setCurrentUser({
            full_name: data.user.full_name,
            profile_url: data.user.profile_url,
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkSavedOpportunities = () => {
      const savedOpportunityIds = JSON.parse(
        localStorage.getItem('athlinked_saved_opportunities') || '[]'
      );
      const savedMap: { [key: string]: boolean } = {};
      const allOpps = [...opportunities, ...scrapedCamps];
      allOpps.forEach(opp => {
        savedMap[opp.id] = savedOpportunityIds.includes(opp.id);
      });
      setSavedOpportunities(savedMap);
    };

    checkSavedOpportunities();
  }, [opportunities, scrapedCamps]);

  const handleCampClick = async (camp: OpportunityItem) => {
    if (camp.link) {
      setShowCampPopup(true);
      setLoadingDetails(true);

      try {
        const response = await fetch(
          `/api/scrape-camp-details?url=${encodeURIComponent(camp.link)}`
        );
        const data = await response.json();

        if (data.success && data.camp) {
          setCampDetails(data.camp);
        }
      } catch (error) {
        console.error('Error fetching camp details:', error);
        setCampDetails({
          title: camp.title,
          image: camp.image,
          date: camp.date || 'Date TBA',
          location: camp.location || 'Location TBA',
          description: 'Click Apply to view full details',
          applyLink: camp.link,
        });
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    setOpportunities(opportunities.filter(item => item.id !== id));
    setScrapedCamps(scrapedCamps.filter(item => item.id !== id));
    if (selectedOpportunity?.id === id) {
      setSelectedOpportunity(null);
    }
  };

  const handleSaveOpportunity = (opportunityId: string) => {
    const savedOpportunityIds = JSON.parse(
      localStorage.getItem('athlinked_saved_opportunities') || '[]'
    );

    let isNowSaved: boolean;
    if (savedOpportunityIds.includes(opportunityId)) {
      // Unsave
      const updatedSavedOpportunities = savedOpportunityIds.filter(
        (id: string) => id !== opportunityId
      );
      localStorage.setItem(
        'athlinked_saved_opportunities',
        JSON.stringify(updatedSavedOpportunities)
      );
      // Also remove from saved data
      const savedOpportunitiesData = JSON.parse(
        localStorage.getItem('athlinked_saved_opportunities_data') || '[]'
      );
      const updatedSavedData = savedOpportunitiesData.filter(
        (opp: OpportunityItem) => opp.id !== opportunityId
      );
      localStorage.setItem(
        'athlinked_saved_opportunities_data',
        JSON.stringify(updatedSavedData)
      );
      isNowSaved = false;
      setSaveAlertMessage('This opportunity is unsaved');
    } else {
      // Save - store the full opportunity object
      const opportunity = allOpportunities.find(
        opp => opp.id === opportunityId
      );
      if (opportunity) {
        const savedOpportunitiesData = JSON.parse(
          localStorage.getItem('athlinked_saved_opportunities_data') || '[]'
        );
        // Check if already exists to avoid duplicates
        if (
          !savedOpportunitiesData.find(
            (opp: OpportunityItem) => opp.id === opportunityId
          )
        ) {
          savedOpportunitiesData.push(opportunity);
          localStorage.setItem(
            'athlinked_saved_opportunities_data',
            JSON.stringify(savedOpportunitiesData)
          );
        }
      }
      const updatedSavedOpportunities = [...savedOpportunityIds, opportunityId];
      localStorage.setItem(
        'athlinked_saved_opportunities',
        JSON.stringify(updatedSavedOpportunities)
      );
      isNowSaved = true;
      setSaveAlertMessage('This opportunity is saved');
    }

    // Update saved state
    setSavedOpportunities(prev => ({
      ...prev,
      [opportunityId]: isNowSaved,
    }));

    // Show alert
    setSaveAlertOpportunityId(opportunityId);
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
      setSaveAlertOpportunityId(null);
    }, 2000);
  };

  const getFilteredData = () => {
    if (activeTab === 'all') return allOpportunities;
    if (activeTab === 'tryouts')
      return allOpportunities.filter(item => item.type === 'tryouts');
    if (activeTab === 'scholarships')
      return allOpportunities.filter(item => item.type === 'scholarship');
    if (activeTab === 'tournaments')
      return allOpportunities.filter(item => item.type === 'tournament');
    return allOpportunities;
  };

  const filteredData = getFilteredData();

  console.log('=== OPPORTUNITIES DEBUG ===');
  console.log('Active Tab:', activeTab);
  console.log('Scraped Camps:', scrapedCamps);
  console.log('All Opportunities:', allOpportunities);
  console.log('Filtered Data:', filteredData);
  console.log('==========================');

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') {
      return undefined;
    }
    if (profileUrl.startsWith('http')) {
      return profileUrl;
    }
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <div className="flex p-5 flex-1">
        <NavigationBar activeItem="opportunities" />

        <div className="flex-1 bg-white mt-0 ml-5 mr-5 mb-5 rounded-xl flex flex-col h-[1200px] overflow-y-auto">
          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-4 px-2 text-base font-medium relative transition-colors ${
                    activeTab === 'all'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                  {/* ({allOpportunities.length}) */}
                  {activeTab === 'all' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('tryouts')}
                  className={`py-4 px-2 text-base font-medium relative transition-colors ${
                    activeTab === 'tryouts'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tryouts & Camp
                  {/* ({allOpportunities.filter(item => item.type === 'tryouts').length}) */}
                  {activeTab === 'tryouts' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('scholarships')}
                  className={`py-4 px-2 text-base font-medium relative transition-colors ${
                    activeTab === 'scholarships'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Scholarships
                  {/* ({allOpportunities.filter(item => item.type === 'scholarship').length}) */}
                  {activeTab === 'scholarships' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('tournaments')}
                  className={`py-4 px-2 text-base font-medium relative transition-colors ${
                    activeTab === 'tournaments'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tournaments
                  {/* ({allOpportunities.filter(item => item.type === 'tournament').length}) */}
                  {activeTab === 'tournaments' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              {loadingCamps && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading camps...</p>
                </div>
              )}

              <div className="space-y-3">
                {filteredData.map(opportunity => (
                  <div
                    key={opportunity.id}
                    onClick={() => {
                      if (opportunity.type === 'tryouts' && opportunity.link) {
                        handleCampClick(opportunity);
                      } else {
                        setSelectedOpportunity(opportunity);
                      }
                    }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                      <img
                        src={opportunity.image}
                        alt={opportunity.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                  <div className="flex-1">
  <p className="text-xs text-gray-500 mb-0.5">
    {opportunity.category}
    {opportunity.sport && ` • ${opportunity.sport}`}
    {opportunity.website && ` • ${opportunity.website}`}
  </p>
  <h3 className="text-base font-medium text-gray-900">
    {opportunity.title}
  </h3>
</div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(opportunity.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      aria-label="Remove opportunity"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>

              {filteredData.length === 0 && !loadingCamps && (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-base">
                    No opportunities available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedOpportunity && selectedOpportunity.type !== 'tryouts' && (
          <div className="w-80 bg-white ml-5 mb-5 rounded-xl p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                <img
                  src={selectedOpportunity.image}
                  alt={selectedOpportunity.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {selectedOpportunity.category}
                </p>
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedOpportunity.title}
                </h3>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Details
            </h2>

            <div className="flex gap-3 mb-6">
              <button className="flex-1 bg-[#CB9729] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B88624] transition-colors">
                Share
              </button>
              <button
                onClick={() => {
                  if (selectedOpportunity) {
                    handleSaveOpportunity(selectedOpportunity.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  selectedOpportunity &&
                  savedOpportunities[selectedOpportunity.id]
                    ? 'bg-[#CB9729] text-white border-[#CB9729]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    selectedOpportunity &&
                    savedOpportunities[selectedOpportunity.id]
                      ? 'fill-current'
                      : ''
                  }`}
                />
                <span className="font-medium">
                  {selectedOpportunity &&
                  savedOpportunities[selectedOpportunity.id]
                    ? 'Saved'
                    : 'Save'}
                </span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedOpportunity.eligibility}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Date & Venue:
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedOpportunity.dates}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOpportunity.venue}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <CampDetailsPopup
        show={showCampPopup}
        loading={loadingDetails}
        campDetails={campDetails}
        onClose={() => setShowCampPopup(false)}
      />

      {/* Save Alert Modal */}
      {saveAlertOpportunityId && (
        <SaveModal
          postId={saveAlertOpportunityId}
          showAlert={showSaveAlert}
          alertMessage={saveAlertMessage}
          isSaved={savedOpportunities[saveAlertOpportunityId] || false}
        />
      )}
    </div>
  );
}
