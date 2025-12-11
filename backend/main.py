from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import SensorData, SensorDataCreate, IrrigationDecision
from irrigation_logic import irrigation_decision

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI()


# Dependency: DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- ROUTES ----------

@app.get("/")
def home():
    return {"message": "IoT Irrigation Backend Running ✔"}


@app.post("/send-data", response_model=IrrigationDecision)
def receive_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):

    # Save to database
    record = SensorData(
        humidity=data.humidity,
        temperature=data.temperature,
        soil_moisture=data.soil_moisture
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Decision based on soil moisture + previous pump state
    decision = irrigation_decision(data.soil_moisture, data.pump_was_active)

    return decision


@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(SensorData).all()