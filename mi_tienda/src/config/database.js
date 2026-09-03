const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI 
const dbName = process.env.DB_NAME 

const client = new MongoClient(uri);
let db = null;
let _supportsTransactions = false;

async function conectarDB() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db(dbName);
    try {
      // Detect if the server is part of a replica set (required for transactions)
      const admin = db.admin();
      let info;
      try {
        info = await admin.command({ hello: 1 });
      } catch (e) {
        info = await admin.command({ isMaster: 1 });
      }
      _supportsTransactions = !!(info && info.setName);
      console.log('Mongo supports transactions:', _supportsTransactions);
    } catch (err) {
      console.warn('Could not detect replica set status, assuming no transactions:', err.message);
      _supportsTransactions = false;
    }
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

function supportsTransactions() {
  return _supportsTransactions;
}

module.exports.supportsTransactions = supportsTransactions;

