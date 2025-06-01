const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DBNAME,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');

    // Vider les tables existantes
    await client.query('DROP TABLE IF EXISTS prices CASCADE');
    await client.query('DROP TABLE IF EXISTS transactions CASCADE');
    await client.query('DROP TABLE IF EXISTS tasks CASCADE');

    // Créer la table prices
    await client.query(`
      CREATE TABLE prices (
        id SERIAL PRIMARY KEY,
        price DECIMAL NOT NULL,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "prices" created');

    // Créer la table transactions
    await client.query(`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
        quantity INTEGER NOT NULL,
        price DECIMAL NOT NULL,
        profit DECIMAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "transactions" created');

    // Créer la table tasks avec les colonnes attendues
    await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo',
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "tasks" created');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});