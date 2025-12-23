'use client';
 
import { useState } from 'react';
 
interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isFollowing: boolean;
}
 
export default function RightSideBar() {
  const [people, setPeople] = useState<Person[]>([
    {
      id: '1',
      name: 'Kingsley',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kingsley',
      isFollowing: false,
    },
    {
      id: '2',
      name: 'Serena Williams',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Serena',
      isFollowing: false,
    },
    {
      id: '3',
      name: 'Michael Phelps',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      isFollowing: false,
    },
    {
      id: '4',
      name: 'Usain Bolt',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Usain',
      isFollowing: false,
    },
    {
      id: '5',
      name: 'Simone Biles',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Simone',
      isFollowing: false,
    },
    {
      id: '6',
      name: 'Lionel Messi',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lionel',
      isFollowing: false,
    },
    {
      id: '7',
      name: 'LeBron James',
      role: 'Athlete',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeBron',
      isFollowing: false,
    },
  ]);
 
  const handleFollow = (id: string) => {
    setPeople(prevPeople =>
      prevPeople.map(person =>
        person.id === id
          ? { ...person, isFollowing: !person.isFollowing }
          : person
      )
    );
  };
 
  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          People you may know
        </h2>
      </div>
 
      {/* People List */}
      <div className="divide-y divide-gray-200">
        {people.map(person => (
          <div
            key={person.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
 
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{person.role}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {person.name}
                </p>
              </div>
 
              {/* Follow Button */}
              <button
                onClick={() => handleFollow(person.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors flex-shrink-0 ${
                  person.isFollowing
                    ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {person.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}