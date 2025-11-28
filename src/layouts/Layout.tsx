import { Outlet } from 'react-router-dom';
import { SideNav } from '@/components/navigation/SideNav';
import { TopBar } from '@/components/navigation/TopBar';

export function Layout() {
  return (
    <div className="flex h-screen">
      <SideNav />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
