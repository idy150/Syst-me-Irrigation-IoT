from firebase_config import db
import time

def irrigation_loop():
    while True:
        sensor_doc = db.collection("sensors").document("device_1").get().to_dict()
        commands_doc = db.collection("commands").document("device_1").get().to_dict()

        humidity = sensor_doc["humidity"]
        threshold = commands_doc["threshold"]

        if humidity < threshold:
            db.collection("commands").document("device_1").update({
                "pump_status": "on"
            })
        else:
            db.collection("commands").document("device_1").update({
                "pump_status": "off"
            })

        time.sleep(5)


if __name__ == "__main__":
    irrigation_loop()
