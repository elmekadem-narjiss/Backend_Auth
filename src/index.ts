import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import batteryRoutes from './routes/batteryRoutes';
import predictionsRouter from './routes/predictions';
import equipmentRoutes from './routes/equipment';
import taskRoutes from './routes/taskRoutes';
import { createServer } from 'http';
import { startWebSocketServer } from './services/websocketService';

// Charger les variables d'environnement dès le début
dotenv.config();

// Vérifier les variables d'environnement critiques
console.log('PG_DBNAME:', process.env.PG_DBNAME);
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_PASSWORD:', process.env.PG_PASSWORD);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_PORT:', process.env.PG_PORT);
console.log('PORT:', process.env.PORT);

// Initialisation de l'application Express
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware pour CORS
app.use(cors({
  origin: 'http://localhost:3000', // Origine du frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes autorisées
  allowedHeaders: ['Content-Type'], // En-têtes autorisés
}));

// Middleware pour parser le JSON
app.use(express.json());

// Routes
app.use('/api/batteries', batteryRoutes);
app.use('/api/predictions', predictionsRouter);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tasks', taskRoutes);

// Route de test
app.get('/', (req: Request, res: Response) => {
  res.send('API de gestion BESS et panneaux solaires');
});

// Middleware de gestion des erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrer le serveur et la connexion à la base de données
const startServer = async () => {
  try {
    await connectDB(); // Connexion à la base de données
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
    startWebSocketServer(server); // Démarrer le serveur WebSocket
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1); // Arrêter le processus en cas d'erreur critique
  }
};

startServer();