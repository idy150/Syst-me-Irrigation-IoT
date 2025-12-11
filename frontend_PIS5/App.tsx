 import React, { useEffect, useState } from 'react';
import { simulationService } from './services/simulationService';
import { Zone, WeatherCondition } from './types';
import ZoneCard from './components/ZoneCard';
import SensorChart from './components/SensorChart';
import AIAdvisor from './components/AIAdvisor';
import { 
  CloudRain, Sun, Cloud, LayoutDashboard, Settings, 
  Droplet, Activity, Power
} from 'lucide-react';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;