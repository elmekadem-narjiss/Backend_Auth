import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import batteryRoutes from './routes/batteryRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/batteries', batteryRoutes);

app.get('/', (req, res) => {
  res.send('API de gestion BESS et panneaux solaires');
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
};



startServer();