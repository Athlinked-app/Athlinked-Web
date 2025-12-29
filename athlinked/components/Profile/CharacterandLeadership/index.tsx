'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import CharacterAndLeadershipPopup, { type CharacterAndLeadership } from '../CharacterandLeadershipPopup';

export type { CharacterAndLeadership };

interface CharacterAndLeadershipProps {
  characterAndLeadership?: CharacterAndLeadership[];
  onCharacterAndLeadershipChange?: (data: CharacterAndLeadership[]) => void;
}

export default function CharacterAndLeadershipComponent({ 
  characterAndLeadership = [], 
  onCharacterAndLeadershipChange 
}: CharacterAndLeadershipProps) {
  const [characterAndLeadershipList, setCharacterAndLeadershipList] = useState<CharacterAndLeadership[]>(characterAndLeadership);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newData: CharacterAndLeadership) => {
    if (editingIndex !== null) {
      // Update existing entry
      const updatedList = [...characterAndLeadershipList];
      updatedList[editingIndex] = newData;
      setCharacterAndLeadershipList(updatedList);
      if (onCharacterAndLeadershipChange) {
        onCharacterAndLeadershipChange(updatedList);
      }
      setEditingIndex(null);
    } else {
      // Add new entry
      const updatedList = [...characterAndLeadershipList, newData];
      setCharacterAndLeadershipList(updatedList);
      if (onCharacterAndLeadershipChange) {
        onCharacterAndLeadershipChange(updatedList);
      }
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedList = characterAndLeadershipList.filter((_, i) => i !== index);
    setCharacterAndLeadershipList(updatedList);
    if (onCharacterAndLeadershipChange) {
      onCharacterAndLeadershipChange(updatedList);
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Character and Leadership</h2>
          <button
            onClick={() => {
              setEditingIndex(null);
              setShowPopup(true);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {characterAndLeadershipList.length === 0 ? (
          <p className="text-gray-500 italic">No character and leadership information added yet. Click the + button to add one.</p>
        ) : (
          <div className="space-y-4">
            {characterAndLeadershipList.map((data, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.teamCaptain && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Team Captain:</span> {data.teamCaptain}
                      </p>
                    )}
                    {data.leadershipRoles && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Leadership Roles:</span> {data.leadershipRoles}
                      </p>
                    )}
                    {data.languagesSpoken && data.languagesSpoken.length > 0 && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Languages Spoken:</span> {data.languagesSpoken.join(', ')}
                      </p>
                    )}
                    {data.communityService && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Community Service:</span> {data.communityService}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CharacterAndLeadershipPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={editingIndex !== null ? characterAndLeadershipList[editingIndex] : undefined}
      />
    </>
  );
}

