import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Sequelize database connection
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: process.env.NODE_ENV !== 'production',
  models: [path.join(__dirname, '../models')],
});

// Test the database connection
const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    throw err;
  }
};

// Initialize database (sync all models)
const initializeDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('Database synchronized successfully');
  } catch (err) {
    console.error('Failed to synchronize database:', err);
    throw err;
  }
};

export { sequelize, testConnection, initializeDatabase }; 