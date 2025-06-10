const { MongoClient } = require('mongodb');
const { config } = require('dotenv')

config()

class DBClient {
  constructor() {

    //const replicaSetHosts = [
    //  'mongodb1:27017',
    //  'mongodb2:27017',
    //  'mongodb3:27017',
    //].join(',')

    //const dbName = process.env.DB_NAME || 'distributed_chat';
    //const replicaSet = process.env.REPLICA_SET || 'rs0';
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;
    const url = process.env.URL
    
    //this.url = `mongodb://${replicaSetHosts}/${dbName}?replicaSet=${replicaSet}`
    this.url = url
    this.client = new MongoClient(this.url, {
      ReadPreference: 'secondaryPreferred'
    });
    this.isConnected = false
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect()
      this.isConnected = true
      console.log('Connected to MongoDB with replica set')
    }
    return this.client
  }

  async getDb() {
    const client = await this.connect()
    return client.db()
  }

  async close() {
    if (this.isConnected) {
      await this.client.close()
      this.isConnected = false
    }
  }
}

const dbClient = new DBClient()

module.exports = dbClient
