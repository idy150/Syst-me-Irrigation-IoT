import requests
import json

url = 'http://localhost:8000/send-data'
data = {
    'zone_id': 'zone-1',
    'humidity': 60.0,
    'temperature': 25.0,
    'soil_moisture': 30.0,
    'rainfall': False,
    'rainfall_intensity': 'none'
}
response = requests.post(url, json=data)
print('Status:', response.status_code)
print('Response:', response.json())