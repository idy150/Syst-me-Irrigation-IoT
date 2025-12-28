import { Zone, CropType, WeatherCondition, SensorData } from '../types';
import { fetchZoneHistory } from './apiService';

const API_BASE_URL = 'http://127.0.0.1:8000';

type Listener = (zones: Zone[], weather: WeatherCondition) => void;

class BackendService {
  private zones: Zone[] = [];
  private weather: WeatherCondition = { condition: 'Sunny', ambientTemp: 25 };
  private listeners: Listener[] = [];
  private intervalId: number | null = null;
  private isRunning = false;
  private pollRate = 3000; // Poll backend every 3 seconds

  constructor() {
    this.initializeZones();
    // Don't start automatically - wait for user to start iterations
  }

  private async initializeZones() {
    // Initialize with default zones
    this.zones = [
      {
        id: 'zone-1',
        name: 'Champ Principal',
        cropType: CropType.CORN,
        area: 12.5,
        isValveOpen: false,
        sensorHistory: [],
        currentReading: {
          timestamp: Date.now(),
          moisture: 0,
          temperature: 0,
          humidity: 0,
          soilMoisture10cm: 0,
          soilMoisture30cm: 0,
          soilMoisture60cm: 0,
          light: 0,
          windSpeed: 0,
          rainfall: false,
          rainfallIntensity: 'none'
        },
        status: 'OPTIMAL'
      }
    ];

    // Generate initial test data
    await this.generateTestData();
    
    // Fetch initial data
    await this.fetchBackendData();
  }

  private async generateTestData() {
    console.log('🧪 [BackendService] Generating initial test data...');
    
    // Generate some historical data points
    const baseTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (let i = 0; i < 20; i++) {
      const timestamp = baseTime + (i * 60 * 60 * 1000); // Every hour
      const moisture = 40 + Math.sin(i * 0.5) * 20 + Math.random() * 10; // Vary between 20-70
      const temperature = 22 + Math.sin(i * 0.3) * 8 + Math.random() * 4; // Vary between 14-38
      const humidity = 50 + Math.sin(i * 0.4) * 20 + Math.random() * 10; // Vary between 20-90
      
      try {
        const response = await fetch(`${API_BASE_URL}/send-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zone_id: 'zone-1',
            humidity: Math.max(0, Math.min(100, humidity)),
            temperature: Math.max(0, Math.min(50, temperature)),
            soil_moisture: Math.max(0, Math.min(100, moisture)),
            soil_moisture_10cm: Math.max(0, Math.min(100, moisture * 0.9 + Math.random() * 5)),
            soil_moisture_30cm: Math.max(0, Math.min(100, moisture + Math.random() * 5)),
            soil_moisture_60cm: Math.max(0, Math.min(100, moisture * 1.1 + Math.random() * 5)),
            light: 400 + Math.random() * 200,
            wind_speed: 5 + Math.random() * 10,
            rainfall: Math.random() < 0.1, // 10% chance of rain
            rainfall_intensity: Math.random() < 0.1 ? 'light' : 'none',
            pump_was_active: false
          })
        });
        
        if (response.ok) {
          console.log(`✅ [BackendService] Test data point ${i + 1}/20 sent`);
        } else {
          console.error(`❌ [BackendService] Failed to send test data point ${i + 1}`);
        }
      } catch (error) {
        console.error(`❌ [BackendService] Error sending test data:`, error);
      }
      
      // Small delay to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ [BackendService] Test data generation completed');
  }

  private async generateRealtimeData() {
    // Generate new sensor readings based on current weather and time
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour > 22;
    
    // Base values that vary with time and weather
    let baseTemp = 25;
    let baseHumidity = 60;
    let baseMoisture = 45;
    let light = 450;
    
    if (this.weather.condition === 'Rainy') {
      baseHumidity += 20;
      baseMoisture += 15;
    } else if (this.weather.condition === 'Cloudy') {
      light -= 200;
    } else if (this.weather.condition === 'Sunny') {
      baseTemp += 5;
      light += 200;
    }
    
    if (isNight) {
      light = 50;
      baseTemp -= 8;
    }
    
    // Add some randomness
    const temperature = baseTemp + (Math.random() - 0.5) * 10;
    const humidity = Math.max(0, Math.min(100, baseHumidity + (Math.random() - 0.5) * 20));
    const moisture = Math.max(0, Math.min(100, baseMoisture + (Math.random() - 0.5) * 15));
    const windSpeed = 5 + Math.random() * 15;
    const rainfall = this.weather.condition === 'Rainy' && Math.random() < 0.3;
    
    try {
      const response = await fetch(`${API_BASE_URL}/send-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: 'zone-1',
          humidity: humidity,
          temperature: temperature,
          soil_moisture: moisture,
          soil_moisture_10cm: Math.max(0, Math.min(100, moisture * 0.9 + (Math.random() - 0.5) * 5)),
          soil_moisture_30cm: Math.max(0, Math.min(100, moisture + (Math.random() - 0.5) * 5)),
          soil_moisture_60cm: Math.max(0, Math.min(100, moisture * 1.1 + (Math.random() - 0.5) * 5)),
          light: Math.max(0, light + (Math.random() - 0.5) * 100),
          wind_speed: windSpeed,
          rainfall: rainfall,
          rainfall_intensity: rainfall ? (Math.random() < 0.5 ? 'light' : 'moderate') : 'none',
          pump_was_active: this.zones[0]?.isValveOpen || false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 [BackendService] New sensor data sent:', {
          temp: temperature.toFixed(1),
          humidity: humidity.toFixed(1),
          moisture: moisture.toFixed(1),
          decision: result.message
        });
        
        // Update weather based on new data
        if (rainfall) {
          this.weather.condition = 'Rainy';
        } else if (light > 600) {
          this.weather.condition = 'Sunny';
        } else if (light > 300) {
          this.weather.condition = 'Cloudy';
        }
        this.weather.ambientTemp = temperature;
        
      } else {
        console.error('❌ [BackendService] Failed to send realtime data');
      }
    } catch (error) {
      console.error('❌ [BackendService] Error sending realtime data:', error);
    }
  }

  private async fetchBackendData() {
    try {
      console.log('🔄 [BackendService] Fetching data from backend...');
      
      // Fetch history for each zone
      for (const zone of this.zones) {
        // Fetch valve state
        const valveResponse = await fetch(`${API_BASE_URL}/valve-state/${zone.id}`);
        const valveData = await valveResponse.json();
        const isValveOpen = valveData.valve_open || false;
        console.log(`💧 [BackendService] Valve state for ${zone.id}: ${isValveOpen ? 'OPEN (Irrigation active)' : 'CLOSED (Irrigation inactive)'}`);
        
        const history = await fetchZoneHistory(zone.id);
        console.log(`📊 [BackendService] Received ${history.length} records for ${zone.id}`);
        
        if (history.length > 0) {
          // Update zone with backend data
          // IMPORTANT: history[0] est le plus récent (ordre décroissant du backend)
          const currentReading = history[0];
          console.log('📡 [BackendService] Latest reading:', {
            temp: currentReading.temperature,
            humidity: currentReading.humidity,
            soil10: currentReading.soilMoisture10cm,
            soil30: currentReading.soilMoisture30cm,
            soil60: currentReading.soilMoisture60cm,
            timestamp: new Date(currentReading.timestamp).toLocaleTimeString()
          });
          
          // Determine status based on moisture
          let status: Zone['status'] = 'OPTIMAL';
          if (currentReading.moisture < 30) status = 'WARNING';
          if (currentReading.moisture < 15) status = 'CRITICAL';
          if (currentReading.moisture > 90) status = 'WARNING';

          // Update weather based on latest sensor data
          this.weather.ambientTemp = currentReading.temperature;
          if (currentReading.rainfall) {
            this.weather.condition = 'Rainy';
          } else if (currentReading.light > 500) {
            this.weather.condition = 'Sunny';
          } else if (currentReading.light > 200) {
            this.weather.condition = 'Cloudy';
          }

          // Update zone - CRÉER UN NOUVEAU TABLEAU pour que React détecte le changement
          const zoneIndex = this.zones.findIndex(z => z.id === zone.id);
          if (zoneIndex !== -1) {
            const updatedZone = {
              ...this.zones[zoneIndex],
              currentReading,
              sensorHistory: history.reverse(), // Inverser pour avoir du plus ancien au plus récent
              status,
              isValveOpen  // Ajouter l'état de la valve
            };
            this.zones = [
              ...this.zones.slice(0, zoneIndex),
              updatedZone,
              ...this.zones.slice(zoneIndex + 1)
            ];
          }
        }
      }

      console.log('✅ [BackendService] Data updated, notifying listeners...');
      this.notify();
    } catch (error) {
      console.error('❌ [BackendService] Error fetching backend data:', error);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    // Send immediate initial state
    listener(this.zones, this.weather);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public start() {
    if (this.isRunning) {
      console.log('⚠️ [BackendService] Already running');
      return;
    }
    this.isRunning = true;
    console.log(`🚀 [BackendService] Starting data generation every ${this.pollRate}ms`);
    
    // Generate new sensor data every poll interval
    this.intervalId = window.setInterval(async () => {
      await this.generateRealtimeData();
      await this.fetchBackendData();
    }, this.pollRate);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ [BackendService] Stopped data generation');
  }

  public async toggleValve(zoneId: string) {
    // Toggle locally first for immediate UI feedback
    const zone = this.zones.find(z => z.id === zoneId);
    const newState = !zone?.isValveOpen;
    
    this.zones = this.zones.map(z => {
      if (z.id === zoneId) {
        return { ...z, isValveOpen: newState };
      }
      return z;
    });
    this.notify();

    // Send valve command to backend
    try {
      const response = await fetch(`${API_BASE_URL}/toggle-valve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zone_id: zoneId, 
          valve_open: newState 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vanne contrôlée:', result.message);
      } else {
        console.error('❌ Erreur lors du contrôle de la vanne');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion au backend:', error);
      // Revert local state on error
      this.zones = this.zones.map(z => {
        if (z.id === zoneId) {
          return { ...z, isValveOpen: !newState };
        }
        return z;
      });
      this.notify();
    }
  }

  public setWeather(condition: 'Sunny' | 'Cloudy' | 'Rainy') {
    // This is just for UI - the real weather comes from backend sensors
    this.weather.condition = condition;
    if (condition === 'Rainy') this.weather.ambientTemp = 20;
    if (condition === 'Sunny') this.weather.ambientTemp = 30;
    if (condition === 'Cloudy') this.weather.ambientTemp = 24;
    this.notify();
  }

  private notify() {
    console.log(`🔔 [BackendService] Notifying ${this.listeners.length} listeners`);
    this.listeners.forEach(l => l(this.zones, this.weather));
  }
}

export const backendService = new BackendService();
