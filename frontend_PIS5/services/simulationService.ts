import { Zone, CropType, WeatherCondition, SensorData } from '../types';

// Initial Mock Data
const INITIAL_ZONES: Zone[] = [
  {
    id: 'z1',
    name: 'Zone Nord - Maïs',
    cropType: CropType.CORN,
    area: 12.5,
    isValveOpen: false,
    sensorHistory: [],
    currentReading: { timestamp: Date.now(), moisture: 45, temperature: 24, humidity: 60 },
    status: 'OPTIMAL'
  },
  {
    id: 'z2',
    name: 'Serre A - Tomates',
    cropType: CropType.TOMATO,
    area: 2.0,
    isValveOpen: true,
    sensorHistory: [],
    currentReading: { timestamp: Date.now(), moisture: 65, temperature: 28, humidity: 80 },
    status: 'OPTIMAL'
  },
  {
    id: 'z3',
    name: 'Vignoble Sud',
    cropType: CropType.VINEYARD,
    area: 8.5,
    isValveOpen: false,
    sensorHistory: [],
    currentReading: { timestamp: Date.now(), moisture: 28, temperature: 26, humidity: 45 },
    status: 'WARNING'
  }
];

type Listener = (zones: Zone[], weather: WeatherCondition) => void;

class SimulationService {
  private zones: Zone[] = JSON.parse(JSON.stringify(INITIAL_ZONES));
  private weather: WeatherCondition = { condition: 'Sunny', ambientTemp: 25 };
  private listeners: Listener[] = [];
  private intervalId: number | null = null;
  private isRunning = false;
  private tickRate = 2000; // Update every 2 seconds

  constructor() {
    this.start();
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
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = window.setInterval(this.tick, this.tickRate);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public toggleValve(zoneId: string) {
    this.zones = this.zones.map(z => {
      if (z.id === zoneId) {
        return { ...z, isValveOpen: !z.isValveOpen };
      }
      return z;
    });
    this.notify();
  }

  public setWeather(condition: 'Sunny' | 'Cloudy' | 'Rainy') {
    this.weather.condition = condition;
    if (condition === 'Rainy') this.weather.ambientTemp = 20;
    if (condition === 'Sunny') this.weather.ambientTemp = 30;
    if (condition === 'Cloudy') this.weather.ambientTemp = 24;
    this.notify();
  }

  private tick = () => {
    const now = Date.now();
    
    // Simulate Weather Impact
    // Fluctuate ambient temp slightly
    this.weather.ambientTemp += (Math.random() - 0.5) * 0.5;

    this.zones = this.zones.map(zone => {
      let { moisture, temperature, humidity } = zone.currentReading;

      // 1. Calculate Temperature
      // Moves towards ambient temp
      const tempDiff = this.weather.ambientTemp - temperature;
      temperature += tempDiff * 0.05;

      // 2. Calculate Moisture
      if (zone.isValveOpen) {
        // Irrigation adds moisture rapidly
        moisture += 2.5; 
      } else if (this.weather.condition === 'Rainy') {
        // Rain adds moisture slowly
        moisture += 0.5;
      } else {
        // Evaporation
        // Hotter = faster evaporation
        const evaporationRate = 0.1 + (temperature > 25 ? (temperature - 25) * 0.05 : 0);
        moisture -= evaporationRate;
      }

      // Clamp Moisture
      moisture = Math.min(100, Math.max(0, moisture));

      // 3. Humidity links to moisture and weather
      humidity = moisture * 0.6 + (this.weather.condition === 'Rainy' ? 30 : 10) + (Math.random() * 5);
      humidity = Math.min(100, Math.max(0, humidity));

      // 4. Update Status
      let status: Zone['status'] = 'OPTIMAL';
      if (moisture < 30) status = 'WARNING';
      if (moisture < 15) status = 'CRITICAL';
      // Too wet is also bad
      if (moisture > 90) status = 'WARNING'; 

      const newReading: SensorData = {
        timestamp: now,
        moisture,
        temperature,
        humidity
      };

      // Keep history limited to last 50 points to prevent memory issues in this demo
      const newHistory = [...zone.sensorHistory, newReading].slice(-50);

      return {
        ...zone,
        currentReading: newReading,
        sensorHistory: newHistory,
        status
      };
    });

    this.notify();
  };

  private notify() {
    this.listeners.forEach(l => l(this.zones, this.weather));
  }
}

export const simulationService = new SimulationService();