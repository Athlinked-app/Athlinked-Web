import Image from 'next/image';

export default function Herosection2() {
  return (
    <div className="w-full bg-[#D4D4D4]">
      <section className="w-full px-8 py-6 md:px-16 lg:px-6 mt-5">
        <div className=" mx-auto bg-white rounded-lg p-6">
          <h2 className="text-4xl md:text-4xl font-bold text-[#171717] mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-[#525252] mb-8 max-w-6xl">
            AthLinked provides powerful tools to help young athletes showcase
            their talents and connect with opportunities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/network.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                Networking
              </h3>
              <p className="text-[#525252] text-lg">
                Connect directly with coaches, recruiters, and other athletes to
                expand your opportunities.
              </p>
            </div>

            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/stats.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                Stats Tracking
              </h3>
              <p className="text-[#525252] text-lg">
                Track and visualize performance statistics over time to measure
                growth and identify areas for improvement.
              </p>
            </div>

            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/AthScore.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                AthScore
              </h3>
              <p className="text-[#525252] text-lg">
                Our proprietary rating system helps recruiters identify top
                talent based on verified performance metrics.
              </p>
            </div>

            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/Dynamicprofiles.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#525252] mb-2">
                Dynamic Profiles
              </h3>
              <p className="text-[#525252] text-lg">
                Create comprehensive athlete profiles showcasing your skills,
                achievements and highlight videos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-8 py-6 md:px-16 lg:px-6 ">
        <div className=" mx-auto bg-white rounded-lg p-6">
          <h2 className="text-4xl md:text-4xl font-bold text-[#171717] mb-4">
            Who We Support
          </h2>
          <p className="text-xl text-[#525252] mb-8 max-w-6xl">
            Helping athletes grow, parents stay involved, coaches recruit, and
            organizations thrive with confidence and success.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/Dynamicprofiles.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                For Athletes
              </h3>
              <p className="text-[#525252] text-lg">
                Connect directly with coaches, recruiters, and other athletes to
                expand your opportunities.
              </p>
            </div>

            <div className="border border-[#E5E5E5] border-2 rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/Parent.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                For Parents
              </h3>
              <p className="text-[#525252] text-lg">
                Track and visualize performance statistics over time to measure
                growth and identify areas for improvement.
              </p>
            </div>

            <div className="border border-[#E5E5E5] rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/Coach.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                For Coaches and Recruiters
              </h3>
              <p className="text-[#525252] text-lg">
                Track and visualize performance statistics over time to measure
                growth and identify areas for improvement.
              </p>
            </div>

            <div className="border border-[#E5E5E5] rounded-lg p-6 bg-white">
              <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/assets/Homescreen/Organization.png"
                  alt="Networking"
                  width={44}
                  height={44}
                  className="w-16 h-16"
                />
              </div>
              <h3 className="text-2xl font-bold text-[#171717] mb-2">
                For Organization
              </h3>
              <p className="text-[#525252] text-lg">
                Connect directly with coaches, recruiters, and other athletes to
                expand your opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-6 md:px-16 lg:px-6">
        <div className="relative mx-auto rounded-lg overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto text-left px-8 py-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Take Your Athletic Career to the Next Level?
            </h2>
            <p className="text-lg md:text-2xl text-white mb-8">
              Join thousands of athletes, coaches, and recruiters already on
              AthLinked
            </p>
            <button className="px-10 py-4 bg-white text-[#002767] text-xl font-bold rounded-md hover:bg-gray-100 transition-colors shadow-lg">
              Join us
            </button>
          </div>

          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-[url('/assets/Homescreen/Herosection2.png')] bg-cover bg-center"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
