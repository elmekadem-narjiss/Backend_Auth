const { Sequelize } = require('sequelize');

async function setupDatabase() {
  const sequelize = new Sequelize({
    database: process.env.PG_DBNAME || 'energy_db',
    username: process.env.PG_USER || 'admin',
    password: process.env.PG_PASSWORD || 'admin123',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.sync({ force: true });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();