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

// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware pour CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
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

// Exporte app pour les tests
export { app };

// Démarrer le serveur (exécuté uniquement si ce fichier est le point d'entrée principal)
if (require.main === module) {
  const startServer = async () => {
    try {
      await connectDB();
      server.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
      });
      startWebSocketServer(server);
    } catch (error) {
      console.error('Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }
    
  };
  startServer();
  
}