import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  charset: string;
  timezone: string;
}

const config: DatabaseConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '3306'),
  user: import.meta.env.VITE_DB_USER || 'mailflow',
  password: import.meta.env.VITE_DB_PASSWORD || 'mailflow',
  database: import.meta.env.VITE_DB_NAME || 'mailflow',
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let pool: mysql.Pool | null = null;

export const createPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool(config);
  }
  return pool;
};

export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  const currentPool = createPool();
  try {
    const [results] = await currentPool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Erreur SQL:', error);
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await executeQuery('SELECT 1');
    return true;
  } catch (error) {
    console.error('Test de connexion échoué:', error);
    return false;
  }
};

export default { createPool, executeQuery, testConnection };