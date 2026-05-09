import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components';
import { Home, AddRecord, Stats, Budget, AIAssistant, Profile } from '@/pages';

export default function App() {
  return (
    <Router>
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
    </Router>
  );
}
