import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.PG_DBNAME || 'energy_db',
  username: process.env.PG_USER || 'admin',
  password: process.env.PG_PASSWORD || 'admin123',
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  dialect: 'postgres',
  logging: false,
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à PostgreSQL établie');
    await sequelize.sync({ alter: true }); // Met à jour les tables en ajoutant/modifiant les colonnes
  } catch (error) {
    console.error('Erreur de connexion à PostgreSQL:', error);
    process.exit(1);
  }
};

export default sequelize;