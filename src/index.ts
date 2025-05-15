import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import batteryRoutes from './routes/batteryRoutes';
import predictionsRouter from './routes/predictions';
import equipmentRoutes from './routes/equipment';
import { createServer } from 'http';
import { startWebSocketServer } from './services/websocketService';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/batteries', batteryRoutes);
app.use('/api/predictions', predictionsRouter);
app.use('/api/equipment', equipmentRoutes);

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('API de gestion BESS et panneaux solaires');
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
    startWebSocketServer(server);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
  }
};

startServer();