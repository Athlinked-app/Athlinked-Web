'use client';

interface AboutMeProps {
  bio?: string;
}

export default function AboutMe({ bio }: AboutMeProps) {
  return (
    <div className="w-full bg-white rounded-lg px-1 md:px-3 py-5">
      <h2 className="text-lg font-bold text-gray-900 mb-3">About Me</h2>
      <div className="space-y-2">
        {bio ? (
          <p className="text-gray-700 whitespace-pre-wrap text-base">{bio}</p>
        ) : (
          <p className="text-gray-500 italic text-base">
            No bio available. Click "Edit Profile" to add your biography.
          </p>
        )}
      </div>
    </div>
  );
}
