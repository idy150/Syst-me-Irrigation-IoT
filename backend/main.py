from fastapi import FastAPI
from models import SensorData, PumpCommand, Threshold
from firebase_config import db

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Smart Irrigation Backend Running"}

@app.get("/sensor")
def get_sensor_data():
    doc = db.collection("sensors").document("device_1").get()
    return doc.to_dict()

@app.post("/sensor")
def update_sensor(sensor: SensorData):
    db.collection("sensors").document("device_1").set(sensor.dict())
    return {"message": "Sensor data updated"}

@app.post("/threshold")
def set_threshold(threshold: Threshold):
    db.collection("commands").document("device_1").update({
        "threshold": threshold.threshold
    })
    return {"message": "Threshold updated"}

@app.post("/pump")
def control_pump(cmd: PumpCommand):
    db.collection("commands").document("device_1").update({
        "pump_status": cmd.status
    })
    return {"message": f"Pump set to {cmd.status}"}
