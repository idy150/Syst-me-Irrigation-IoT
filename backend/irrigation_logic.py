def irrigation_decision(soil_moisture: float) -> dict:
    """
    Soil moisture scale: 0 (dry) → 100 (wet)
    Pump ON if soil moisture < 30
    """

    if soil_moisture < 30:
        return {
            "pump": True,
            "message": "Soil dry → Pump activated"
        }
    else:
        return {
            "pump": False,
            "message": "Soil moisture sufficient → Pump OFF"
        }
