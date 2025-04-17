import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import { databaseConfig, shouldResetDatabase } from './database.config';

// Sequelize database connection
const sequelize = new Sequelize({
  dialect: 'mysql',
  ...databaseConfig,
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
const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ force: shouldResetDatabase() });
    console.log('Database synchronized successfully');
  } catch (err) {
    console.error('Failed to synchronize database:', err);
    throw err;
  }
};

export { sequelize, testConnection, initializeDatabase }; 