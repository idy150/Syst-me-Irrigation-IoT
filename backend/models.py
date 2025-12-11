from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel

from database import Base

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    humidity = Column(Float)
    temperature = Column(Float)
    soil_moisture = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------- Pydantic Models ----------

class SensorDataCreate(BaseModel):
    humidity: float
    temperature: float
    soil_moisture: float
    pump_was_active: bool = False  # État précédent de la pompe

class IrrigationDecision(BaseModel):
    pump: bool
    message: str
