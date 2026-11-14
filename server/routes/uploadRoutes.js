const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const File = require("../models/FileModel");

const router = express.Router();

const uploadFolder = "uploads";

// Create uploads folder automatically
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// File storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maximum 10 MB
  },
});

// Allowed file extensions
const allowedExtensions = [".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"];

// DFA-based filename validation
function validateFilenameDFA(filename) {
  let state = "q0";

  for (let char of filename) {
    if (/^[a-zA-Z0-9_-]$/.test(char)) {
      if (state === "q0" || state === "q1") {
        state = "q1";
      }
    } else {
      state = "qReject";
      break;
    }
  }

  return state === "q1";
}

// Upload and validate file
router.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size exceeds the maximum limit of 10 MB!",
        });
      }

      return res.status(400).json({
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file!",
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    const filename = path.basename(req.file.originalname, extension);

    // DFA-based filename validation
    if (!validateFilenameDFA(filename)) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message:
          "Invalid filename! Only letters, numbers, underscore and hyphen are allowed.",
      });
    }

    // Extension validation
    if (!allowedExtensions.includes(extension)) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Invalid file extension!",
      });
    }

    try {
      // Generate unique sharing ID
      const shareId = crypto.randomUUID();

      // Save file details in MongoDB
      const newFile = new File({
        originalName: req.file.originalname,
        storedName: req.file.filename,
        category: req.body.category,
        extension: extension,
        shareId: shareId,
        fileSize: req.file.size,
      });

      await newFile.save();

      res.json({
        message: "File uploaded successfully!",
        shareId: shareId,
        shareLink: `/api/share/${shareId}`,
      });
    } catch (error) {
      fs.unlinkSync(req.file.path);

      console.log("Database Error:", error.message);

      res.status(500).json({
        message: "File uploaded but database saving failed!",
      });
    }
  });
});

// Display uploaded files from MongoDB
router.get("/files", async (req, res) => {
  try {
    const files = await File.find();

    res.json(
      files.map((file) => ({
        originalName: file.originalName,
        category: file.category,
        storedName: file.storedName,
        shareId: file.shareId,
        fileSize: file.fileSize,
        uploadDate: file.uploadDate,
      })),
    );
  } catch (error) {
    res.status(500).json({
      message: "Unable to get files",
    });
  }
});

// Download uploaded files
router.get("/download/:filename", async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    const file = await File.findOne({
      storedName: filename,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found!",
      });
    }

    const filePath = path.join(uploadFolder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found!",
      });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({
      message: "Download failed!",
    });
  }
});

// Download using unique sharing ID
router.get("/share/:shareId", async (req, res) => {
  try {
    const file = await File.findOne({
      shareId: req.params.shareId,
    });

    if (!file) {
      return res.status(404).json({
        message: "Invalid sharing link!",
      });
    }

    const filePath = path.join(uploadFolder, file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found!",
      });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({
      message: "Unable to download shared file!",
    });
  }
});

// Delete uploaded files from storage and MongoDB
router.delete("/delete/:filename", async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    const file = await File.findOne({
      storedName: filename,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found!",
      });
    }

    const filePath = path.join(uploadFolder, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.deleteOne({
      _id: file._id,
    });

    res.json({
      message: "File deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete file!",
    });
  }
});

module.exports = router;
