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
import { executeManualTrade, getLatestPrice, getTransactions } from './services/energyProviderService';
import axios, { AxiosError } from 'axios';

// Ajout d'un commentaire pour déclencher une nouvelle analyse SonarCloud
//test declanche
// Importer le module energyQueue pour démarrer les workers
import './queues/energyQueue'; // Importe et exécute le code automatiquement

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

// Route pour exécuter une transaction manuelle
app.post('/api/energy/trade', async (req: Request, res: Response) => {
  try {
    const { type, quantity } = req.body;
    if (!type || !quantity || !['buy', 'sell'].includes(type)) {
      throw new Error('Type ou quantité invalide');
    }

    // Fetch evaluation data
    let soc;
    try {
      const evaluateResponse = await axios.get('http://localhost:5000/api/evaluate', { timeout: 5000 });
      console.log('Evaluate Response:', evaluateResponse.data);
      const { metrics } = evaluateResponse.data;
      if (!metrics || typeof metrics.soc_final !== 'number') {
        throw new Error('Invalid metrics data');
      }
      soc = metrics.soc_final;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error fetching /api/evaluate:', error.message, 'Response:', error.response?.data);
      } else {
        console.error('Error fetching /api/evaluate:', error);
      }
      throw new Error('Failed to fetch SOC data');
    }

    // Fetch price with error handling
    let price;
    try {
      price = await getLatestPrice();
      console.log('Price:', price, 'SOC:', soc, 'Quantity:', quantity);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error fetching price:', error.message, 'Response:', error.response?.data);
      } else {
        console.error('Error fetching price:', error);
      }
      throw new Error('Failed to fetch price data');
    }

    if (type === 'buy') {
      if (price >= 0.05) throw new Error('Prix trop élevé pour acheter');
      if (soc >= 80) throw new Error('SOC trop élevé pour acheter');
      if (quantity > 10) throw new Error('Quantité dépasse la limite d\'achat');
    }
    if (type === 'sell' && (price <= 0.12 || soc <= 60 || quantity > 5)) {
      throw new Error('Conditions de vente non remplies');
    }

    const result = await executeManualTrade(type, quantity);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erreur lors de la transaction:', error.message);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Erreur lors de la transaction:', error);
      res.status(400).json({ error: 'Unknown error during transaction' });
    }
  }
});

// Nouvelle route pour récupérer le SOC
app.get('/api/energy/soc', async (req: Request, res: Response) => {
  try {
    const evaluateResponse = await axios.get('http://localhost:5000/api/evaluate', { timeout: 5000 });
    const { metrics } = evaluateResponse.data;
    if (!metrics || typeof metrics.soc_final !== 'number') {
      throw new Error('Invalid metrics data');
    }
    const soc = metrics.soc_final;
    res.json({ soc });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error fetching SOC:', error.message, 'Response:', error.response?.data);
    } else {
      console.error('Error fetching SOC:', error);
    }
    res.status(500).json({ error: 'Failed to fetch SOC data' });
  }
});

// Route pour récupérer le dernier prix
app.get('/api/energy/prices', async (req: Request, res: Response) => {
  try {
    const price = await getLatestPrice();
    res.json([{ price }]); // Retourne un tableau [{ price: <valeur> }]
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error fetching prices' });
    }
  }
});

// Route pour récupérer l'historique des transactions
app.get('/api/energy/transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await getTransactions();
    res.json(transactions);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error fetching transactions' });
    }
  }
});

// Route pour récupérer les résultats d'évaluation
app.get('/api/evaluate', async (req: Request, res: Response) => {
  try {
    const pythonApiUrl = 'http://localhost:8001/evaluate';
    const response = await axios.get(pythonApiUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la requête à FastAPI:', error);
    res.status(500).json({ error: (error as any).message });
  }
});

// Routes existantes
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

// Démarrer le serveur
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