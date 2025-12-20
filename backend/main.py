from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from database import db
from models import SensorData, SensorDataCreate, IrrigationDecision, ValveState, ValveToggleRequest, ValveToggleResponse
from irrigation_logic import irrigation_decision

app = FastAPI()

# Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# Dependency: DB
async def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    return db


# ---------- ROUTES ----------

@app.get("/")
def home():
    try:
        return {"message": "IoT Irrigation Backend Running ✔"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/send-data", response_model=IrrigationDecision)
async def receive_sensor_data(data: SensorDataCreate, db: AsyncIOMotorDatabase = Depends(get_db)):

    # Save to database with all fields
    record = SensorData(
        zone_id=data.zone_id,
        humidity=data.humidity,
        temperature=data.temperature,
        soil_moisture=data.soil_moisture,
        soil_moisture_10cm=data.soil_moisture_10cm or data.soil_moisture * 0.9,
        soil_moisture_30cm=data.soil_moisture_30cm or data.soil_moisture,
        soil_moisture_60cm=data.soil_moisture_60cm or data.soil_moisture * 1.1,
        light=data.light or 450.0,
        wind_speed=data.wind_speed or 8.0,
        rainfall=data.rainfall,
        rainfall_intensity=data.rainfall_intensity
    )
    await db.sensor_data.insert_one(record.dict(by_alias=True))

    # Decision based on soil moisture + previous pump state
    decision = irrigation_decision(data.soil_moisture, data.pump_was_active)

    return decision


@app.get("/history")
async def get_history(zone_id: str = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    query = {}
    if zone_id:
        query["zone_id"] = zone_id
    
    cursor = db.sensor_data.find(query).sort("created_at", -1).limit(100)
    records = await cursor.to_list(length=100)
    
    # Convert to frontend format
    return [
        {
            "id": str(r["_id"]),
            "zone_id": r["zone_id"],
            "timestamp": int(r["created_at"].timestamp() * 1000),
            "moisture": r["soil_moisture"],
            "temperature": r["temperature"],
            "humidity": r["humidity"],
            "soilMoisture10cm": r.get("soil_moisture_10cm", r["soil_moisture"] * 0.9),
            "soilMoisture30cm": r.get("soil_moisture_30cm", r["soil_moisture"]),
            "soilMoisture60cm": r.get("soil_moisture_60cm", r["soil_moisture"] * 1.1),
            "light": r.get("light", 450.0),
            "windSpeed": r.get("wind_speed", 8.0),
            "rainfall": r["rainfall"],
            "rainfallIntensity": r["rainfall_intensity"],
            "created_at": r["created_at"].isoformat()
        }
        for r in records
    ]


@app.post("/toggle-valve", response_model=ValveToggleResponse)
async def toggle_valve(request: ValveToggleRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Contrôle manuel de la vanne d'irrigation pour une zone.
    Active ou désactive la pompe/électrovanne.
    """
    # Upsert the valve state
    await db.valve_states.update_one(
        {"zone_id": request.zone_id},
        {"$set": {"is_open": request.valve_open, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    
    # TODO: Intégration matérielle - Contrôler le GPIO/relais
    # import RPi.GPIO as GPIO
    # GPIO.output(VALVE_PIN, GPIO.HIGH if request.valve_open else GPIO.LOW)
    
    status = "ouverte" if request.valve_open else "fermée"
    action = "💦 IRRIGATION ACTIVÉE" if request.valve_open else "🛑 IRRIGATION ARRÊTÉE"
    
    if request.valve_open:
        visual_emojis = "🚿🌱🌿💧💦"
        animation_type = "watering"
        sound_message = "Le champ est en train de se faire arroser"
        sound_url = "/static/sounds/irrigation_started.mp3"
    else:
        visual_emojis = "⛔🌱😴"
        animation_type = "stopped"
        sound_message = "L'arrosage est arrêté"
        sound_url = "/static/sounds/irrigation_stopped.mp3"
    
    return ValveToggleResponse(
        zone_id=request.zone_id,
        valve_open=request.valve_open,
        message=f"{action} - Vanne {status} pour {request.zone_id}",
        visual_emojis=visual_emojis,
        animation_type=animation_type,
        sound_message=sound_message,
        sound_url=sound_url
    )


@app.get("/valve-state/{zone_id}")
async def get_valve_state(zone_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Récupère l'état actuel de la vanne pour une zone.
    """
    valve_state = await db.valve_states.find_one({"zone_id": zone_id})
    
    if not valve_state:
        # Retourner état par défaut si non trouvé
        return {
            "zone_id": zone_id,
            "valve_open": False,
            "message": "Aucun état trouvé - vanne fermée par défaut"
        }
    
    return {
        "zone_id": valve_state["zone_id"],
        "valve_open": valve_state["is_open"],
        "updated_at": valve_state["updated_at"].isoformat()
    }