const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure "uploads/" directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Configuration (File Uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://Venkatesh:Gambler@123@cluster0.azvgd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Define Schema & Model
const jobSchema = new mongoose.Schema({
  jobRole: { type: String, required: true },
  companyName: { type: String, required: true },
  jobDescription: { type: String, required: true },
  resumePath: { type: String, required: true },
  coverLetterPath: { type: String, default: null }, // Optional
  date: { type: Date, default: Date.now },
});

const Job = mongoose.model("Job", jobSchema);

// API to Save a New Job Application (Cover Letter is Optional)
app.post("/save-job", upload.fields([{ name: "resume" }, { name: "coverLetter" }]), async (req, res) => {
  try {
    const { jobRole, companyName, jobDescription } = req.body;
    const resumePath = req.files["resume"] ? `/uploads/${req.files["resume"][0].filename}` : null;
    const coverLetterPath = req.files["coverLetter"] ? `/uploads/${req.files["coverLetter"][0].filename}` : null;

    // Validate required fields
    if (!jobRole || !companyName || !jobDescription || !resumePath) {
      return res.status(400).json({ message: "Job Role, Company Name, Job Description, and Resume are required." });
    }

    const newJob = new Job({
      jobRole,
      companyName,
      jobDescription,
      resumePath: `http://localhost:5000${resumePath}`,
      coverLetterPath: coverLetterPath ? `http://localhost:5000${coverLetterPath}` : null,
    });

    await newJob.save();
    res.json({ message: "Job application saved successfully!" });
  } catch (err) {
    console.error("Error saving job:", err);
    res.status(500).json({ message: "Error saving job application" });
  }
});

// API to Fetch Saved Job Applications
app.get("/get-jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// API to Serve Uploaded Files (Resumes & Cover Letters)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
