const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Use environment variable for MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://username:password@cluster0.mongodb.net/jobApplications?retryWrites=true&w=majority";
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// File upload setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Define schema
const jobSchema = new mongoose.Schema({
  jobRole: { type: String, required: true },
  companyName: { type: String, required: true },
  jobDescription: { type: String, required: true },
  resumePath: { type: String, required: true },
  coverLetterPath: { type: String, default: null },
  date: { type: Date, default: Date.now },
});

const Job = mongoose.model("Job", jobSchema);

// Save job
app.post("/save-job", upload.fields([{ name: "resume" }, { name: "coverLetter" }]), async (req, res) => {
  try {
    const { jobRole, companyName, jobDescription } = req.body;
    const resumePath = req.files["resume"] ? `/uploads/${req.files["resume"][0].filename}` : null;
    const coverLetterPath = req.files["coverLetter"] ? `/uploads/${req.files["coverLetter"][0].filename}` : null;

    if (!jobRole || !companyName || !jobDescription || !resumePath) {
      return res.status(400).json({ message: "Job Role, Company Name, Job Description, and Resume are required." });
    }

    const newJob = new Job({
      jobRole,
      companyName,
      jobDescription,
      resumePath: `https://your-heroku-app.herokuapp.com${resumePath}`,
      coverLetterPath: coverLetterPath ? `https://your-heroku-app.herokuapp.com${coverLetterPath}` : null,
    });

    await newJob.save();
    res.json({ message: "Job application saved successfully!" });
  } catch (err) {
    console.error("Error saving job:", err);
    res.status(500).json({ message: "Error saving job application" });
  }
});

// Fetch jobs
app.get("/get-jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// Serve files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
