import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div key={location.pathname} className="page-transition">
        <Outlet />
      </div>
      <Navigation />
    </div>
  );
}
