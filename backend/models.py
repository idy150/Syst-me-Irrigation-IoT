from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from bson import ObjectId

# Custom ObjectId field for Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

class SensorData(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    zone_id: str = "zone-1"
    humidity: float
    temperature: float
    soil_moisture: float
    soil_moisture_10cm: Optional[float] = None
    soil_moisture_30cm: Optional[float] = None
    soil_moisture_60cm: Optional[float] = None
    light: Optional[float] = None
    wind_speed: Optional[float] = None
    rainfall: bool = False
    rainfall_intensity: str = "none"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ValveState(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    zone_id: str
    is_open: bool = False
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------- Pydantic Models for API ----------

class SensorDataCreate(BaseModel):
    zone_id: str = "zone-1"
    humidity: float
    temperature: float
    soil_moisture: float
    soil_moisture_10cm: Optional[float] = None
    soil_moisture_30cm: Optional[float] = None
    soil_moisture_60cm: Optional[float] = None
    light: Optional[float] = None
    wind_speed: Optional[float] = None
    rainfall: bool = False
    rainfall_intensity: Literal['light', 'moderate', 'heavy', 'none'] = 'none'
    pump_was_active: bool = False  # État précédent de la pompe

class SensorDataResponse(BaseModel):
    id: str
    zone_id: str
    timestamp: int  # milliseconds
    moisture: float
    temperature: float
    humidity: float
    soilMoisture10cm: float
    soilMoisture30cm: float
    soilMoisture60cm: float
    light: float
    windSpeed: float
    rainfall: bool
    rainfallIntensity: str
    created_at: str

class IrrigationDecision(BaseModel):
    pump: bool
    message: str
    visual_emojis: str  # Emojis animés à afficher
    animation_type: str  # Type d'animation (e.g., "watering", "stopped")
    sound_message: str  # Message vocal à jouer
    sound_url: Optional[str] = None  # URL du fichier audio si disponible

class ValveToggleRequest(BaseModel):
    zone_id: str
    valve_open: bool

class ValveToggleResponse(BaseModel):
    zone_id: str
    valve_open: bool
    message: str
    visual_emojis: str  # Emojis animés
    animation_type: str  # Type d'animation
    sound_message: str  # Message vocal
    sound_url: Optional[str] = None  # URL audio
