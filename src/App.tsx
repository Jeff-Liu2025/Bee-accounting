import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components';

const Home = lazy(() => import('@/pages/Home'));
const AddRecord = lazy(() => import('@/pages/AddRecord'));
const Stats = lazy(() => import('@/pages/Stats'));
const Budget = lazy(() => import('@/pages/Budget'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const Profile = lazy(() => import('@/pages/Profile'));

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddRecord />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
