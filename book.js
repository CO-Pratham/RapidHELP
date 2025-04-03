// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");

// const app = express();
// app.use(express.json());
// app.use(cors()); // Allow frontend to access backend

// // Connect to MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/rapidHELP", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log(" MongoDB Connected!"))
//   .catch((err) => console.error(" MongoDB Connection Error:", err));

// // Worker Schema
// const WorkerSchema = new mongoose.Schema({
//   name: String,
//   profession: String,
//   photo: String,
//   location: {
//     type: { type: String, enum: ["Point"], default: "Point" },
//     coordinates: { type: [Number], required: true },
//   },
// });

// WorkerSchema.index({ location: "2dsphere" }); // GeoSpatial Index
// const Worker = mongoose.model("Worker", WorkerSchema);

// //  Route to Register Worker
// app.post("/add-worker", async (req, res) => {
//   try {
//     const { name, profession, photo, latitude, longitude } = req.body;
//     const newWorker = new Worker({
//       name,
//       profession,
//       photo,
//       location: {
//         type: "Point",
//         coordinates: [longitude, latitude], // Longitude first!
//       },
//     });
//     await newWorker.save();
//     res.json({ message: "✅ Worker added successfully!" });
//   } catch (error) {
//     res.status(500).json({ error: " Error adding worker" });
//   }
// });

// //  Route to Search for Nearby Workers
// app.post("/search-worker", async (req, res) => {
//   try {
//     const { profession, latitude, longitude } = req.body;

//     const workers = await Worker.find({
//       profession,
//       location: {
//         $near: {
//           $geometry: { type: "Point", coordinates: [longitude, latitude] },
//           $maxDistance: 5000, // Search within 5 km radius
//         },
//       },
//     });

//     if (workers.length === 0) {
//       return res.json({ message: " No workers found nearby!" });
//     }

//     // Send notification to all found workers (simulated)
//     workers.forEach((worker) => {
//       console.log(` Sending request to ${worker.name}`);
//     });

//     res.json({ workers, message: " Workers found & notified!" });
//   } catch (error) {
//     res.status(500).json({ error: " Error searching workers" });
//   }
// });

// //  Route to Accept/Reject Request
// app.post("/respond-booking", async (req, res) => {
//   const { workerId, response } = req.body;

//   if (response === "accept") {
//     return res.json({ message: " Booking accepted!" });
//   } else {
//     return res.json({ message: " Booking rejected!" });
//   }
// });

// // Start Server
// app.listen(5000, () => console.log(" Server running on port 5000..."));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/rapidHELP", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(" MongoDB Connected!"))
.catch(err => console.log(" MongoDB Connection Error:", err));

// Define Worker Schema
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

// Store booking requests in memory (Temporary)
let bookingRequests = [];

//  Add a Worker
app.post("/add-worker", async (req, res) => {
    try {
        const { name, profession, photo, latitude, longitude } = req.body;
        const newWorker = new Worker({
            name,
            profession,
            photo,
            location: { type: "Point", coordinates: [longitude, latitude] },
        });

        await newWorker.save();
        res.json({ message: " Worker added successfully!" });
    } catch (error) {
        res.status(500).json({ error: " Error adding worker" });
    }
});

//  Search for Workers Based on Location & Profession
app.post("/search-workers", async (req, res) => {
    try {
        const { profession, latitude, longitude } = req.body;

        const workers = await Worker.find({
            profession,
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 5000, // 5 km radius
                },
            },
        });

        if (workers.length === 0) {
            return res.json({ message: "❌ No workers found nearby!" });
        }

        // Store booking requests for workers
        bookingRequests = workers.map(worker => ({
            workerId: worker._id,
            workerName: worker.name,
            workerPhoto: worker.photo,
            profession,
        }));

        res.json({ workers, message: " Booking requests sent to workers!" });
    } catch (error) {
        res.status(500).json({ error: " Error finding workers" });
    }
});

//  Get Booking Requests for Workers
app.get("/worker-requests", (req, res) => {
    res.json(bookingRequests);
});

//  Worker Accept/Reject Booking Request
app.post("/respond-booking", (req, res) => {
    const { workerId, response } = req.body;

    const requestIndex = bookingRequests.findIndex(req => req.workerId === workerId);
    if (requestIndex === -1) {
        return res.status(404).json({ message: "❌ Request not found!" });
    }

    if (response === "accept") {
        res.json({ message: " Worker accepted the request!" });
    } else {
        res.json({ message: " Worker rejected the request!" });
    }

    // Remove request from list after response
    bookingRequests.splice(requestIndex, 1);
});

// Start Server
app.listen(5000, () => console.log(" Server running on port 5000..."));


