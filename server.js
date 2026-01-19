require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const JSON_FILE_PATH = path.join(__dirname, 'locations.json');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mapData';
mongoose.connect(MONGODB_URI);

const db = mongoose.connection;
db.on('error', (err) => console.error('MongoDB connection error:', err));
db.once('open', () => console.log('Connected to MongoDB'));
db.on('disconnected', () => console.log('MongoDB disconnected'));

const locationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  area: String,
  city: String,
  state: String,
  country: String,
  dateSaved: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', locationSchema);

// Function to handle JSON file updates
function handleJsonUpdate(newData) {
  // 1. Read the existing file
  fs.readFile(JSON_FILE_PATH, 'utf8', (err, data) => {
    let jsonArray = [];

    if (!err && data) {
      try {
        jsonArray = JSON.parse(data);
      } catch (e) {
        jsonArray = []; // Reset if file is corrupted
      }
    }

    // 2. Add new data
    jsonArray.push(newData);

    // 3. Write back to file
    fs.writeFile(JSON_FILE_PATH, JSON.stringify(jsonArray, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing JSON:", writeErr);
        return;
      }

      console.log("JSON Updated.");
    });
  });
}

// POST route - Triggered by both Search and Map Click
app.post('/api/locations', async (req, res) => {
  try {
    // Save to MongoDB
    const newLoc = new Location(req.body);
    const savedLoc = await newLoc.save();

    // Save to JSON and Refresh File
    handleJsonUpdate(req.body);

    res.status(200).send(savedLoc);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
