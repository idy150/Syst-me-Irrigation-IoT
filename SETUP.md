# Guide de Configuration - Système d'Irrigation IoT

## Configuration Backend

### 1. Installation des dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Démarrer le serveur backend
```bash
uvicorn main:app --reload --port 8000
```

Le backend sera accessible sur: `http://127.0.0.1:8000`

## Configuration Frontend

### 1. Installation des dépendances
```bash
cd frontend_PIS5
npm install
```

### 2. Démarrer le serveur de développement
```bash
npm run dev
```

Le frontend sera accessible sur: `http://localhost:3000`

## Vérification de la connexion

1. Backend: Visitez `http://127.0.0.1:8000` - vous devriez voir `{"message": "IoT Irrigation Backend Running ✔"}`
2. Frontend: Visitez `http://localhost:3000` - l'interface devrait se charger
3. Les requêtes API du frontend vers le backend devraient fonctionner grâce à la configuration CORS

## Endpoints API disponibles

- `GET /` - Vérification du statut
- `POST /send-data` - Envoyer des données de capteurs
- `GET /history` - Récupérer l'historique des données

## Ports utilisés

- Backend: `8000`
- Frontend: `3000`
