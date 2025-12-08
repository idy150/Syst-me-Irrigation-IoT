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
  const [zones, setZones] = useState<Zone[]>([]);
  const [weather, setWeather] = useState<WeatherCondition>({ condition: 'Sunny', ambientTemp: 25 });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Subscribe to simulation service on mount
  useEffect(() => {
    const unsubscribe = simulationService.subscribe((updatedZones, updatedWeather) => {
      setZones(updatedZones);
      setWeather(updatedWeather);
      
      // Auto-select first zone if none selected
      if (!selectedZoneId && updatedZones.length > 0) {
        setSelectedZoneId(updatedZones[0].id);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  const handleValveToggle = (id: string) => {
    simulationService.toggleValve(id);
  };

  const handleWeatherChange = (condition: 'Sunny' | 'Cloudy' | 'Rainy') => {
    simulationService.setWeather(condition);
  };

  // Safe check for loading state
  if (zones.length === 0 || !selectedZone) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Initialisation de SmartIrrig...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-lg">
              <Droplet size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SmartIrrig</h1>
          </div>
          <p className="text-slate-400 text-xs mt-2 pl-1">IoT & AI Dashboard</p>
        </div>

        <nav className="p-4 space-y-2 flex-grow">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-900/20">
            <LayoutDashboard size={20} />
            <span className="font-medium">Tableau de bord</span>
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
            Contrôle Simulation
          </div>
          <div className="space-y-1 px-2">
             <button 
                onClick={() => handleWeatherChange('Sunny')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Sunny' ? 'bg-slate-800 text-yellow-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <Sun size={18} /> Soleil
             </button>
             <button 
                onClick={() => handleWeatherChange('Cloudy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Cloudy' ? 'bg-slate-800 text-gray-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <Cloud size={18} /> Nuageux
             </button>
             <button 
                onClick={() => handleWeatherChange('Rainy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Rainy' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <CloudRain size={18} /> Pluie
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Simulation active <br/> WebSocket Mock v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* Header Stats */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
            <p className="text-gray-500">Météo actuelle: <span className="font-medium text-gray-700">{weather.condition === 'Sunny' ? 'Ensoleillé' : weather.condition === 'Rainy' ? 'Pluvieux' : 'Nuageux'}</span> • Temp. Ambiante: {weather.ambientTemp.toFixed(1)}°C</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Système en ligne</span>
             </div>
          </div>
        </header>

        {/* Zones Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {zones.map(zone => (
            <ZoneCard 
              key={zone.id} 
              zone={zone} 
              isSelected={selectedZoneId === zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
            />
          ))}
        </section>

        {/* Detail View */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
          
          {/* Charts Column */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-600"/>
                  Données temps réel : {selectedZone.name}
                </h3>
              </div>
              <button 
                onClick={() => handleValveToggle(selectedZone.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${selectedZone.isValveOpen ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
              >
                <Power size={18} />
                {selectedZone.isValveOpen ? 'ARRÊTER IRRIGATION' : 'DÉMARRER IRRIGATION'}
              </button>
            </div>

            <div className="flex-grow grid grid-rows-2 gap-6 min-h-[300px]">
              {/* Moisture Chart */}
              <div className="relative">
                <h4 className="absolute top-0 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider z-10">Humidité du sol</h4>
                <div className="h-full pt-6">
                  <SensorChart 
                    data={selectedZone.sensorHistory} 
                    dataKey="moisture" 
                    color="#3b82f6" 
                    unit="%"
                  />
                </div>
              </div>
              
              {/* Temp Chart */}
              <div className="relative">
                <h4 className="absolute top-0 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider z-10">Température</h4>
                 <div className="h-full pt-6">
                  <SensorChart 
                    data={selectedZone.sensorHistory} 
                    dataKey="temperature" 
                    color="#f97316" 
                    unit="°C"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Advisor Column */}
          <div className="lg:col-span-1 h-[400px] lg:h-full">
            <AIAdvisor selectedZone={selectedZone} weatherCondition={weather.condition} />
          </div>

        </section>
      </main>
    </div>
  );
}

export default App;