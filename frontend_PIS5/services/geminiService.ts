import { GoogleGenAI } from "@google/genai";
import { Zone } from '../types';

const apiKey = process.env.API_KEY || ''; 

// Safe initialization
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("SmartIrrig: No API Key found in environment. AI features will mock responses.");
}

export const getIrrigationAdvice = async (zone: Zone, weatherCondition: string): Promise<string> => {
  if (!ai) {
    return "API Key manquante. Veuillez configurer votre clé API Google Gemini pour obtenir des conseils en temps réel. (Simulation: Arrosez si l'humidité est < 30%)";
  }

  try {
    const prompt = `
      Agis comme un agronome expert pour le système "SmartIrrig".
      Analyse les données suivantes pour une zone de culture et donne une recommandation concise (max 3 phrases) sur l'irrigation.
      
      Données de la zone:
      - Nom: ${zone.name}
      - Culture: ${zone.cropType}
      - Humidité du sol actuelle: ${zone.currentReading.moisture.toFixed(1)}%
      - Température: ${zone.currentReading.temperature.toFixed(1)}°C
      - État de la vanne: ${zone.isValveOpen ? 'OUVERTE' : 'FERMÉE'}
      
      Météo actuelle: ${weatherCondition}
      
      Si l'humidité est critique (<20%), sois alarmiste. Si tout va bien, sois rassurant. Recommande d'ouvrir ou fermer la vanne si nécessaire.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Aucun conseil disponible.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Erreur lors de la communication avec l'IA. Vérifiez votre connexion.";
  }
};