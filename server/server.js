const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3500;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('srmMarketplace');
    const listings = db.collection('listings');

    // Define the /test endpoint
    app.get('/test', (req, res) => {
      res.send('MongoDB connection successful!');
    });

    // Define the / endpoint (optional root route)
    app.get('/', (req, res) => {
      res.send('SRM Marketplace Server is running!');
    });

    // Define the /addListing endpoint
    app.post('/addListing', async (req, res) => {
      const { title, price, imageBase64 } = req.body;
      const listing = { title, price, imageBase64, date: new Date() };
      const result = await listings.insertOne(listing);
      res.send(result);
    });
  } catch (err) {
    console.error(err);
    process.exit(1); // Exit if connection fails
  }
}

run().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(console.dir);