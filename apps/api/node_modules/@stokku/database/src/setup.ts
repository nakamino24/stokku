import { Pool } from 'pg';
import { execSync } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the current directory (database package)
dotenvConfig({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse the DATABASE_URL to get connection parameters
const url = new URL(DATABASE_URL);
const user = url.username;
const password = url.password;
const host = url.hostname;
const port = parseInt(url.port, 10) || 5432;
const dbName = url.pathname.substring(1); // removes the leading '/'

// We'll connect to the default database (usually 'postgres') to create our database if it doesn't exist
const adminConnectionConfig = {
  user,
  password,
  host,
  port,
  database: 'postgres', // connect to the default database
};

async function main() {
  console.log(`Setting up database '${dbName}'...`);

  const pool = new Pool(adminConnectionConfig);

  let client;
  try {
    client = await pool.connect();
    // Check if the database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rowCount === 0) {
      // Database does not exist, create it
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }

  // Now run the Prisma migration
  console.log('Running Prisma migrations...');
  try {
    // We run the migration from the current directory (database package)
    // The Prisma schema is in ./prisma/schema.prisma
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main();