import Herosection from '@/components/Homescreen/Herosection';
import Hersosection1 from '@/components/Homescreen/Herosection1';
import Herosection2 from '@/components/Homescreen/Herosection2';

export default function Landing() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      <main className="flex min-h-screen w-full flex-col ">
        <Herosection />
        <Hersosection1 />
        <Herosection2 />
      </main>
    </div>
  );
}
