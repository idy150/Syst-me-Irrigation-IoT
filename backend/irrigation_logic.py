def irrigation_decision(soil_moisture: float, pump_was_active: bool = False) -> dict:
    """
    Soil moisture scale: 0 (dry) → 100 (wet)
    Simple logic based on soil humidity thresholds
    Logic: Start irrigation at <40%, continue until >=70%
    """
    
    # Seuils d'irrigation basés sur l'humidité du sol
    SEUIL_BAS = 40    # Déclenche irrigation si < 40%
    SEUIL_HAUT = 70   # Arrête irrigation si >= 70%
    
    # Si la pompe était déjà active, continuer jusqu'à atteindre le seuil haut
    if pump_was_active:
        if soil_moisture >= SEUIL_HAUT:
            return {
                "pump": False,
                "message": f"✅ Objectif atteint ({soil_moisture:.1f}% >= {SEUIL_HAUT}%) → Irrigation OFF",
                "visual_emojis": "⛔🌱😴",
                "animation_type": "stopped",
                "sound_message": "L'arrosage est arrêté",
                "sound_url": "/static/sounds/irrigation_stopped.mp3"
            }
        else:
            return {
                "pump": True,
                "message": f"💦 Irrigation en cours ({soil_moisture:.1f}% → objectif {SEUIL_HAUT}%)",
                "visual_emojis": "🚿🌱🌿💧💦",
                "animation_type": "watering",
                "sound_message": "Le champ est en train de se faire arroser",
                "sound_url": "/static/sounds/irrigation_started.mp3"
            }
    
    # Si la pompe était inactive, vérifier s'il faut démarrer
    if soil_moisture < SEUIL_BAS:
        return {
            "pump": True,
            "message": f"💦 Sol sec ({soil_moisture:.1f}%) → Irrigation ON",
            "visual_emojis": "🚿🌱🌿💧💦",
            "animation_type": "watering",
            "sound_message": "Le champ est en train de se faire arroser",
            "sound_url": "/static/sounds/irrigation_started.mp3"
        }
    else:
        return {
            "pump": False,
            "message": f"✓ Humidité OK ({soil_moisture:.1f}%) → Pump OFF",
            "visual_emojis": "⛔🌱😴",
            "animation_type": "stopped",
            "sound_message": "L'arrosage est arrêté",
            "sound_url": "/static/sounds/irrigation_stopped.mp3"
        }
