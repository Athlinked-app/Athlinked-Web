import Link from 'next/link';
import Image from 'next/image';

type HeaderProps = {
  userName?: string;
  userProfileUrl?: string;
};

export default function Header({
  userName = 'User',
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
}: HeaderProps) {
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
          <Image
            src={userProfileUrl}
            alt={`${userName} profile avatar`}
            width={48}
            height={48}
            className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover border border-gray-200"
            priority
          />
        </div>
      </div>
    </nav>
  );
}