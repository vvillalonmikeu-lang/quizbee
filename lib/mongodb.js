const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

function resolveDatabaseName(connectionUri) {
  if (process.env.MONGODB_DB) {
    return process.env.MONGODB_DB;
  }

  try {
    const parsed = new URL(connectionUri);
    const pathname = (parsed.pathname || "").replace(/^\//, "");
    return pathname || "quizbee";
  } catch {
    return "quizbee";
  }
}

const databaseName = resolveDatabaseName(uri);

let cachedClient;
let cachedClientPromise;

if (global._quizbeeMongoClient) {
  cachedClient = global._quizbeeMongoClient;
}

if (global._quizbeeMongoClientPromise) {
  cachedClientPromise = global._quizbeeMongoClientPromise;
}

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect();
    global._quizbeeMongoClientPromise = cachedClientPromise;
  }

  cachedClient = await cachedClientPromise;
  global._quizbeeMongoClient = cachedClient;
  return cachedClient;
}

async function getQuestionsCollection() {
  const client = await getMongoClient();
  return client.db(databaseName).collection("questions");
}

module.exports = {
  databaseName,
  getMongoClient,
  getQuestionsCollection
};