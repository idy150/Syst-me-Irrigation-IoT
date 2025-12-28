#!/usr/bin/env python3
"""
Test script pour vérifier la connexion frontend-backend-MongoDB
avec génération de données de stimulation
"""

import requests
import time
import random
import json

API_BASE_URL = "http://localhost:8000"

def generate_sensor_data(zone_id):
    """Génère des données de capteurs réalistes"""
    return {
        "zone_id": zone_id,
        "humidity": round(random.uniform(20, 80), 1),
        "temperature": round(random.uniform(15, 35), 1),
        "soil_moisture": round(random.uniform(10, 90), 1),
        "light_level": round(random.uniform(200, 1000), 0)
    }

def test_connection():
    """Test complet de la connexion"""
    print("🧪 Test de connexion Frontend-Backend-MongoDB")
    print("=" * 50)

    # Test 1: Connexion backend de base
    try:
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend: Connexion OK")
            print(f"   Message: {response.json()['message']}")
        else:
            print("❌ Backend: Erreur de connexion")
            return False
    except Exception as e:
        print(f"❌ Backend: Erreur - {e}")
        return False

    # Test 2: Historique initial
    try:
        response = requests.get(f"{API_BASE_URL}/history?limit=1")
        initial_count = len(response.json())
        print(f"✅ MongoDB: Historique accessible ({initial_count} enregistrements)")
    except Exception as e:
        print(f"❌ MongoDB: Erreur d'accès - {e}")
        return False

    # Test 3: Envoi de données de stimulation
    print("\n🚀 Test de génération de données de stimulation...")
    zones = ["zone1", "zone2", "zone3"]

    for i in range(3):
        for zone in zones:
            data = generate_sensor_data(zone)
            try:
                response = requests.post(f"{API_BASE_URL}/send-data",
                                       json=data,
                                       headers={"Content-Type": "application/json"})

                if response.status_code == 200:
                    result = response.json()
                    status = "💧 IRRIGATION" if result['pump'] else "⛔ STOPPED"
                    print(f"   {zone}: {status} - {result['message'][:30]}...")
                else:
                    print(f"   {zone}: ❌ Erreur {response.status_code}")

            except Exception as e:
                print(f"   {zone}: ❌ Erreur - {e}")

        time.sleep(1)  # Pause entre les cycles

    # Test 4: Vérification de la sauvegarde
    try:
        response = requests.get(f"{API_BASE_URL}/history?limit=1")
        final_count = len(response.json())
        print(f"\n✅ MongoDB: Données sauvegardées ({final_count - initial_count} nouvelles)")
    except Exception as e:
        print(f"❌ MongoDB: Erreur de vérification - {e}")

    # Test 5: Test des vannes
    print("\n🔧 Test des vannes...")
    try:
        # Toggle vanne
        response = requests.post(f"{API_BASE_URL}/toggle-valve",
                               json={"zone_id": "zone1", "valve_open": False},
                               headers={"Content-Type": "application/json"})

        if response.status_code == 200:
            result = response.json()
            print(f"   Toggle vanne: ✅ {result['message'][:40]}...")

        # Vérifier état
        response = requests.get(f"{API_BASE_URL}/valve-state/zone1")
        if response.status_code == 200:
            state = response.json()
            status = "Ouverte" if state['valve_open'] else "Fermée"
            print(f"   État vanne: ✅ {status}")
    except Exception as e:
        print(f"❌ Vannes: Erreur - {e}")

    print("\n🎉 Test terminé!")
    return True

if __name__ == "__main__":
    test_connection()