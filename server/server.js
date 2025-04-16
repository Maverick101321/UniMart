const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = 3500;

app.use(cors());
app.use(express.json());

// Rate limit for addListing endpoint
app.use('/addListing', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
}));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('srmMarketplace');
    const listings = db.collection('listings');
    const users = db.collection('users');

    // Create TTL index for auto-expiry (7 days)
    await listings.createIndex({ date: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

    // Test endpoint
    app.get('/test', (req, res) => {
      res.send('MongoDB connection successful!');
    });

    // Root endpoint
    app.get('/', (req, res) => {
      res.send('SRM Marketplace Server is running!');
    });

    // Add listing endpoint with validation
    app.post('/addListing', async (req, res) => {
      const { title, price, imageBase64, location, sellerId, sellerEmail } = req.body;
      if (!title || !price || !sellerId || !sellerEmail) {
        return res.status(400).send({ error: 'Title, price, sellerId, and sellerEmail are required' });
      }
      if (title.length > 100) {
        return res.status(400).send({ error: 'Title must be under 100 characters' });
      }
      if (isNaN(price) || price <= 0) {
        return res.status(400).send({ error: 'Price must be a positive number' });
      }
      if (imageBase64 && !imageBase64.startsWith('data:image/')) {
        return res.status(400).send({ error: 'Invalid image format' });
      }
      const listing = {
        title,
        price: Number(price),
        imageBase64,
        location,
        sellerId,
        sellerEmail,
        date: new Date()
      };
      const result = await listings.insertOne(listing);
      // Initialize user in users collection if new
      await users.updateOne(
        { email: sellerEmail },
        { $setOnInsert: { rating: 0, numRatings: 0, isVerified: false } },
        { upsert: true }
      );
      res.send(result);
    });

    // Get all listings with optional society filter
    app.get('/listings', async (req, res) => {
      const { society } = req.query;
      const query = society ? { location: society } : {};
      const listings = await listings.find(query).toArray();
      res.send(listings);
    });

    // Get single listing by ID
    app.get('/listing/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const listing = await listings.findOne({ _id: new ObjectId(id) });
        if (!listing) return res.status(404).send({ error: 'Listing not found' });
        res.send(listing);
      } catch (error) {
        res.status(400).send({ error: 'Invalid listing ID' });
      }
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(console.dir);