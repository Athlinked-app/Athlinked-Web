import Herosection from '@/components/Homescreen/Herosection';
import Hersosection1 from '@/components/Homescreen/Herosection1';

export default function Hello() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      <main className="flex min-h-screen w-full flex-col ">
        <Herosection />
        <Hersosection1/>
    

      </main>
    </div>
  );
}