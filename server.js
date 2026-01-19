const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

const JSON_FILE_PATH = path.join(__dirname, 'locations.json');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mapData')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

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

      // 4. Open the file (Editors like VS Code will just refresh the tab)
      const command = process.platform === 'win32' ? 'start' : 'open';
      exec(`${command} "" "${JSON_FILE_PATH}"`);
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

app.listen(3000, () => console.log('Server running on port 3000'));