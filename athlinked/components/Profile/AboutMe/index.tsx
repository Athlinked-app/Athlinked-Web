'use client';

interface AboutMeProps {
  bio?: string;
}

export default function AboutMe({ bio }: AboutMeProps) {
  return (
    <div className="w-full bg-white rounded-lg px-6">
      <h2 className="text-base font-bold text-gray-900 mb-2">About Me</h2>
      <div className="space-y-2">
        {bio ? (
          <p className="text-gray-700 whitespace-pre-wrap">{bio}</p>
        ) : (
          <p className="text-gray-500 italic text-sm">
            No bio available. Click "Edit Profile" to add your biography.
          </p>
        )}
      </div>
    </div>
  );
}
