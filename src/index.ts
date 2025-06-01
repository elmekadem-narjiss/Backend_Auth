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
import { query } from './config/postgres';

// Ajout d'un commentaire pour déclencher une nouvelle analyse SonarCloud
//test declanche
import './queues/energyQueue';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(express.json());

app.post('/api/energy/trade', async (req: Request, res: Response) => {
  try {
    const { type, quantity } = req.body;
    if (!type || !quantity || !['buy', 'sell'].includes(type)) {
      throw new Error('Type ou quantité invalide');
    }

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

    let price;
    try {
      price = await getLatestPrice(query);
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
      if (price > 0.20) throw new Error('Prix trop élevé pour acheter');
      if (soc > 50) throw new Error('SOC trop élevé pour acheter');
      if (quantity > 10) throw new Error('Quantité dépasse la limite d\'achat');
    }
    if (type === 'sell') {
      if (price < 0.10) throw new Error('Prix trop bas pour vendre');
      if (soc < 60) throw new Error('SOC trop bas pour vendre');
      if (quantity > 5) throw new Error('Quantité dépasse la limite de vente');
    }

    const result = await executeManualTrade(type, quantity, query);
    res.status(200).json(result);
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

app.get('/api/energy/prices', async (req: Request, res: Response) => {
  try {
    const price = await getLatestPrice(query);
    res.json([{ price }]);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error fetching prices' });
    }
  }
});

app.get('/api/energy/transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await getTransactions(query);
    res.json(transactions);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error fetching transactions' });
    }
  }
});

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

app.use('/api/batteries', batteryRoutes);
app.use('/api/predictions', predictionsRouter);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API de gestion BESS et panneaux solaires');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

export { app };

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