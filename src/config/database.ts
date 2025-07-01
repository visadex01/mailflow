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
  host: 'localhost',
  port: 3306,
  user: 'mailflow',
  password: 'mailflow',
  database: 'mailflow',
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

export const executeTransaction = async (queries: Array<{query: string, params: any[]}>) => {
  const connection = await createPool().getConnection();
  try {
    await connection.beginTransaction();
    
    for (const { query, params } of queries) {
      await connection.execute(query, params);
    }
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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

export default { createPool, executeQuery, executeTransaction, testConnection };