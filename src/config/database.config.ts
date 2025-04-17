import dotenv from 'dotenv';

dotenv.config();

export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cartonord',
  logging: process.env.NODE_ENV !== 'production',
};

export const shouldResetDatabase = (): boolean => {
  // En production, on ne réinitialise jamais la base de données
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // En développement, on réinitialise uniquement si explicitement demandé
  return process.env.DB_FORCE_RESET === 'true';
}; 