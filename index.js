require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('Connection error:', err));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});
const URL_model = mongoose.model('URL_model', urlSchema);

// Challenge API
let shortUrlCounter = 1; 
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const urlRegex = /^(http|https):\/\/[^\s$.?#].[^\s]*$/;

  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const urlObject = new URL(originalUrl);  
  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    URL_model.findOne({ original_url: originalUrl })
      .then(foundUrl => {
        if (foundUrl) {
          return res.json({
            original_url: foundUrl.original_url,
            short_url: foundUrl.short_url,
          });
        } else {
          const newUrl = new URL_model({
            original_url: originalUrl,
            short_url: shortUrlCounter++, 
          });

          newUrl.save()
            .then(savedUrl => {
              res.json({
                original_url: savedUrl.original_url,
                short_url: savedUrl.short_url,
              });
            })
            .catch(err => {
              return res.status(500).json({ error: 'Database error' });
            });
        }
      })
      .catch(err => {
        return res.status(500).json({ error: 'Database error' });
      });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  URL_model.findOne({ short_url: shortUrl })
    .then(foundUrl => {
      if (!foundUrl) {
        return res.json({ error: 'No short URL found for the given input' });
      }
      res.redirect(foundUrl.original_url);
    })
    .catch(err => {
      return res.status(500).json({ error: 'Database error' });
    });
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Implementation using Arrays.
/*
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory storage for URLs (instead of a database)
let urlData = [];  // Array to store original and short URLs
let shortUrlCounter = 1; // Incremental counter for short URLs

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Challenge API - POST to create a short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const urlRegex = /^(http|https):\/\/[^\s$.?#].[^\s]*$/;

  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const urlObject = new URL(originalUrl);  // Create a URL object to check validity
  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if the original URL already exists in the in-memory data structure
    const foundUrl = urlData.find(url => url.original_url === originalUrl);

    if (foundUrl) {
      // If found, return the existing short_url
      return res.json({
        original_url: foundUrl.original_url,
        short_url: foundUrl.short_url,
      });
    } else {
      // If not found, create a new short URL
      const newUrl = {
        original_url: originalUrl,
        short_url: shortUrlCounter++,
      };

      urlData.push(newUrl);  // Store the new URL pair in memory
      return res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    }
  });
});

// API Endpoint for GET /api/shorturl/:short_url to redirect to the original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  // Find the original URL based on short_url
  const foundUrl = urlData.find(url => url.short_url === shortUrl);

  if (!foundUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  // Redirect to the original URL
  res.redirect(foundUrl.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
 
*/