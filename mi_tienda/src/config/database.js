const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017';
const dbName = process.env.DB_NAME || 'Tienda_Online';

const client = new MongoClient(uri);
let db = null;

async function conectarDB() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Conectado exitosamente a MongoDB');
    return db;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    throw error;
  }
}

async function connectToDatabase() {
  return conectarDB();
}

module.exports = {
  conectarDB,
  connectToDatabase,
  client,
  dbName
};
