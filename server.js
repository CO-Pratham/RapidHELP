// // require("dotenv").config();
// // const express = require("express");
// // const mongoose = require("mongoose");
// // const cors = require("cors");

// // const app = express();
// // app.use(express.json());
// // app.use(cors()); // Allow frontend to access backend

// // //  Connect to MongoDB
// // // mongoose.connect("mongodb://localhost:27017/rapidHELP", {
// // //     useNewUrlParser: true,
// // //     useUnifiedTopology: true
// // // }).then(() => console.log(" MongoDB Connected!"))
// // // .catch(err => console.error(" MongoDB Connection Error:", err));

// // //const mongoose = require('mongoose');

// // mongoose.connect('mongodb://127.0.0.1:27017/rapidHELP', {   // iss ki vjh se mongodb connect hua hai yaad rakhna
// //   useNewUrlParser: true,
// //   useUnifiedTopology: true
// // })
// // .then(() => console.log(' MongoDB Connected!'))
// // .catch(err => console.log(' MongoDB Connection Error:', err));


// // //  Define Schema & Model (No need for models/Worker.js)
// // const workerSchema = new mongoose.Schema({
// //     name: String,
// //     profession: String,
// //     photo: String
// // });

// // const Worker = mongoose.model("Worker", workerSchema);

// // //  Route to add worker (Frontend sends data here)
// // app.post("/add-worker", async (req, res) => {
// //     try {
// //         const { name, profession, photo } = req.body;
// //         const newWorker = new Worker({ name, profession, photo });
// //         await newWorker.save();
// //         res.json({ message: " Worker added successfully!" });
// //     } catch (error) {
// //         res.status(500).json({ error: " Error adding worker" });
// //     }
// // });

// // //  Start Server
// // app.listen(5000, () => console.log(" Server running on port 5000..."));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to access backend

// 1️⃣ Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/rapidHELP", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("🔥 MongoDB Connected!"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// 2️⃣ Define Worker Schema & Model
const WorkerSchema = new mongoose.Schema({
    name: String,
    profession: String,
    photo: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
});

// Create a geospatial index
WorkerSchema.index({ location: "2dsphere" });

const Worker = mongoose.model("Worker", WorkerSchema);

// 3️⃣ Route to Add Worker (Frontend Sends Data Here)
app.post("/add-worker", async (req, res) => {
    try {
        const { name, profession, photo, latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "📍 Location is required!" });
        }

        const newWorker = new Worker({ 
            name, 
            profession, 
            photo, 
            location: {
                type: "Point",
                coordinates: [longitude, latitude] // Store location
            }
        });

        await newWorker.save();
        res.json({ message: " Worker added successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: " Error adding worker" });
    }
});

// 4️⃣ Search Worker by Profession & Location
app.post("/search-worker", async (req, res) => {
    try {
        const { profession, latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "📍 Location is required!" });
        }

        const workers = await Worker.find({
            profession,
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 5000 // 5km radius
                }
            }
        });

        res.json(workers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: " Error searching worker" });
    }
});

// 5️⃣ Start Server
app.listen(5000, () => console.log(" Server running on port 5000..."));
