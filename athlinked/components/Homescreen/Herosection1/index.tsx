import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src="/assets/Homescreen/MobileHeosection1.png"
        alt="Athletes in action"
        fill
        className="object-cover md:hidden"
        priority
        quality={80}
      />
      <Image
        src="/assets/Homescreen/Herosection1.png"
        alt="Athletes in action"
        fill
        className="hidden md:block object-cover"
        priority
        quality={80}
      />

      <div className="absolute inset-0 z-[1]" />

      <div className="relative z-10 flex items-center h-full px-8 md:px-16 lg:px-24 pb-20">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Connect, Compete,
            <br />
            and <span className="text-white">Get Discovered</span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-200 mb-8 font-medium max-w-8xl leading-relaxed">
            AthLinked is the premier platform for young athletes aged 12-21 to
            showcase their talent. Here, athletes can connect with college
            recruiters, scouts, and coaches from top organizations and colleges,
            building opportunities for scholarships and future careers.
          </p>

          <button className="px-10 py-4 bg-white text-[#002767] text-xl font-bold rounded-md hover:bg-gray-100 transition-colors shadow-lg">
            Join us
          </button>
        </div>
      </div>
    </div>
  );
}
