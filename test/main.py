import time
import random
from sensors import CapteurHumidite, CapteurTemperature, CapteurLumiere, CapteurPluie, CapteurVent, CapteurDebitEau
from config import CONFIG_SIMULATION, CONFIG_CAPTEURS, SIMULATION_CONFIG, SENSOR_CONFIG
from utils import obtenir_statut_systeme

print("🌱 SmartIrrig - Simulation IoT")
print("✅ Initialisation des capteurs...\n")

# Initialisation des capteurs
capteurs = {
    'humidite_10cm': CapteurHumidite(65, "10cm"),
    'humidite_30cm': CapteurHumidite(70, "30cm"),
    'humidite_60cm': CapteurHumidite(75, "60cm"),
    'temperature': CapteurTemperature(),
    'lumiere': CapteurLumiere(),
    'pluie': CapteurPluie(),
    'vent': CapteurVent(),
    'debit_eau': CapteurDebitEau()
}

# État du système
est_en_irrigation = False
temps_simulation = 0
saison = CONFIG_SIMULATION['saison']

print("🚀 Simulation démarrée!")
print("=" * 50)

while True:
    heure_actuelle = temps_simulation % 24
    
    # Simulation météo
    pleut, intensite_pluie = capteurs['pluie'].simuler()
    vitesse_vent = capteurs['vent'].simuler()
    
    # Simulation capteurs
    temperature = capteurs['temperature'].simuler(heure_actuelle, saison)
    lumiere = capteurs['lumiere'].simuler(heure_actuelle)
    
    # Simulation humidité
    humidite_10cm = capteurs['humidite_10cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    humidite_30cm = capteurs['humidite_30cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    humidite_60cm = capteurs['humidite_60cm'].simuler(300, temperature, lumiere, vitesse_vent, est_en_irrigation, pleut)
    
    # Simulation eau
    debit, eau_totale = capteurs['debit_eau'].simuler(est_en_irrigation)
    
    # Affichage
    print(f"⏰ {int(heure_actuelle):02d}:00 | 💧 Humidité 10cm: {humidite_10cm}% | 🌡️ Temp: {temperature:.1f}°C")
    print(f"☀️  Lux: {lumiere} | 🌬️ Vent: {vitesse_vent} km/h | 🌧️ Pluie: {'Oui' if pleut else 'Non'}")
    print(f"💦 Irrigation: {'ACTIVE' if est_en_irrigation else 'INACTIVE'} | Débit: {debit:.1f} L/min")
    print(f"📊 Statut: {obtenir_statut_systeme(humidite_10cm)}")
    print("-" * 50)
    
    # Irrigation automatique intelligente multi-facteurs
    # Critères pour DÉCLENCHER l'irrigation
    doit_irriguer = (
        humidite_10cm < SENSOR_CONFIG['humidity_threshold_low'] and  # Humidité faible
        not pleut and  # Pas de pluie
        temperature > 25 and  # Température élevée
        lumiere > 20000 and  # Période de jour (évaporation forte)
        not est_en_irrigation  # Pas déjà en cours
    )
    
    # Critères pour ARRÊTER l'irrigation
    doit_arreter = (
        (humidite_10cm > SENSOR_CONFIG['humidity_threshold_high'] or  # Humidité suffisante
         pleut or  # Pluie détectée
         temperature < 15 or  # Température trop basse
         lumiere < 5000) and  # Nuit (évaporation faible)
        est_en_irrigation  # En cours d'irrigation
    )
    
    if doit_irriguer:
        print("🚨 Irrigation automatique déclenchée!")
        print(f"   📊 Conditions: Humidité={humidite_10cm}%, Temp={temperature:.1f}°C")
        print(f"   📊 Lumière={lumiere} lux, Pluie={'Oui' if pleut else 'Non'}")
        est_en_irrigation = True
        
    elif doit_arreter:
        raison = "Humidité OK" if humidite_10cm > 70 else "Pluie détectée" if pleut else "Conditions défavorables"
        print(f"✅ Irrigation arrêtée - {raison}")
        est_en_irrigation = False
    
    temps_simulation += 1
    time.sleep(2)
