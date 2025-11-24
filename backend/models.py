from pydantic import BaseModel

class SensorData(BaseModel):
    humidity: float
    temperature: float
    luminosity: float

class PumpCommand(BaseModel):
    status: str  # "on" or "off"

class Threshold(BaseModel):
    threshold: float
