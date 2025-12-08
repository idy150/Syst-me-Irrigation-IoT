CONFIG_SIMULATION = {
    'vitesse_simulation': 5,
    'humidite_initiale': 65,
    'saison': 'ete',
    'irrigation_automatique': True
}

# Garder l'ancienne pour compatibilité
SIMULATION_CONFIG = CONFIG_SIMULATION

CONFIG_CAPTEURS = {
    'seuil_humidite_bas': 30,
    'seuil_humidite_haut': 70,
    'debit_max': 10,
    'temp_min_irrigation': 25,      # Température minimum pour irriguer
    'lux_min_jour': 20000,          # Lumière minimum (éviter irrigation nocturne)
    'vitesse_vent_max': 15          # Vent maximum (éviter évaporation excessive)
}

# Garder l'ancienne pour compatibilité
SENSOR_CONFIG = {
    'humidity_threshold_low': CONFIG_CAPTEURS['seuil_humidite_bas'],
    'humidity_threshold_high': CONFIG_CAPTEURS['seuil_humidite_haut'],
    'max_flow_rate': CONFIG_CAPTEURS['debit_max'],
    'min_irrigation_temp': CONFIG_CAPTEURS['temp_min_irrigation'],
    'min_daylight_lux': CONFIG_CAPTEURS['lux_min_jour'],
    'max_wind_speed': CONFIG_CAPTEURS['vitesse_vent_max']
}