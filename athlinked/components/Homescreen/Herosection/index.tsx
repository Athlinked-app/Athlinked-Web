import Link from 'next/link';
import Image from 'next/image';

export default function Herosection() {
  return (
    <nav className="flex items-center justify-between px-3 md:px-8 py-4 bg-white">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/Homescreen/Logo.png"
            alt="ATHLINKED Logo"
            width={180}
            height={50}
            className="w-32 h-8 md:w-[180px] md:h-[50px]"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login">
          <button className="px-4 py-3 bg-[#CB9729] hover:bg-white hover:border-2 hover:border-[#CB9729] hover:text-[#CB9729] text-white font-bold rounded-md transition-colors">
            Sign in
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-4 py-3 bg-white  text-[#525252] hover:bg-[#CB9729] hover:text-white hover:border-0 font-bold rounded-md border-2 border-[#A3A3A3] transition-colors">
            Sign up
          </button>
        </Link>
      </div>
    </nav>
  );
}
