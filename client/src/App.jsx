import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

const allowedExtensions = [".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"];

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Assignment");
  const [filterCategory, setFilterCategory] = useState("All");
  const [files, setFiles] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [sizeResult, setSizeResult] = useState("");

  // Upload Progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // DFA states
  const [dfaInput, setDfaInput] = useState("");
  const [dfaResult, setDfaResult] = useState("");
  const [dfaStates, setDfaStates] = useState([]);
  const [extensionResult, setExtensionResult] = useState("");

  // Get uploaded files
  const loadFiles = async () => {
    try {
      const response = await axios.get(`${API}/files`);
      setFiles(response.data);
    } catch (error) {
      console.log("Unable to load files:", error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Automatic DFA, extension and size validation
  const validateSelectedFile = (file) => {
    if (!file) {
      setDfaInput("");
      setDfaResult("");
      setDfaStates([]);
      setExtensionResult("");
      setSizeResult("");
      return;
    }

    const fileName = file.name;
    const lastDot = fileName.lastIndexOf(".");

    const fileBaseName =
      lastDot > 0 ? fileName.substring(0, lastDot) : fileName;

    const extension =
      lastDot > 0 ? fileName.substring(lastDot).toLowerCase() : "";

    setDfaInput(fileBaseName);

    // File size validation (Maximum 10 MB)
    const maxSize = 10 * 1024 * 1024;

    if (file.size <= maxSize) {
      setSizeResult("Accepted! File size is within 10 MB.");
    } else {
      setSizeResult("Rejected! File size exceeds 10 MB.");
    }

    // DFA validation
    let state = "q0";
    let states = ["q0"];

    for (let char of fileBaseName) {
      if (/^[a-zA-Z0-9_-]$/.test(char)) {
        if (state === "q0" || state === "q1") {
          state = "q1";
        }
      } else {
        state = "qReject";
      }

      states.push(state);

      if (state === "qReject") break;
    }

    setDfaStates(states);

    if (state === "q1" && fileBaseName.length > 0) {
      setDfaResult("Accepted! Valid Filename.");
    } else {
      setDfaResult("Rejected! Invalid Filename.");
    }

    // Extension validation
    if (allowedExtensions.includes(extension)) {
      setExtensionResult("Accepted! Valid Extension.");
    } else {
      setExtensionResult("Rejected! Invalid Extension.");
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    setSelectedFile(file || null);
    setMessage("");
    setShareLink("");
    setUploadProgress(0);

    validateSelectedFile(file);
  };

  // Handle Drag and Drop
  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (file) {
      setSelectedFile(file);
      setMessage("");
      setShareLink("");
      setUploadProgress(0);

      validateSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file!");
      return;
    }

    if (isUploading) return;

    // Stop upload if DFA rejects filename
    if (!dfaResult.startsWith("Accepted")) {
      setMessage("Upload Blocked! DFA rejected the filename.");
      return;
    }

    // Stop upload if extension is invalid
    if (!extensionResult.startsWith("Accepted")) {
      setMessage("Upload Blocked! Invalid file extension.");
      return;
    }

    // Stop upload if file size exceeds 10 MB
    if (!sizeResult.startsWith("Accepted")) {
      setMessage("Upload Blocked! File size exceeds 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("file", selectedFile);

    try {
      setUploadProgress(0);
      setIsUploading(true);
      setMessage("");

      const response = await axios.post(`${API}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );

            setUploadProgress(percent);
          }
        },
      });

      setUploadProgress(100);
      setMessage(response.data.message);

      const link = `${API}/share/${response.data.shareId}`;
      setShareLink(link);

      setSelectedFile(null);
      setDfaInput("");
      setDfaResult("");
      setDfaStates([]);
      setExtensionResult("");
      setSizeResult("");

      loadFiles();
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      console.log("SERVER RESPONSE:", error.response?.data);

      setMessage(error.response?.data?.message || error.message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Copy latest sharing link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setMessage("Sharing link copied successfully!");
    } catch (error) {
      setMessage("Unable to copy sharing link!");
    }
  };

  // Delete file
  const handleDelete = async (filename) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${filename}?`,
    );

    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${API}/delete/${encodeURIComponent(filename)}`,
      );

      setMessage(response.data.message);
      loadFiles();
    } catch (error) {
      console.log("DELETE ERROR:", error);
      setMessage(error.response?.data?.message || error.message);
    }
  };

  // Share individual file
  const handleShare = async (file) => {
    const link = `${API}/share/${file.shareId}`;

    try {
      await navigator.clipboard.writeText(link);
      setMessage(`Sharing link copied for ${file.originalName}!`);
    } catch (error) {
      setShareLink(link);
      setMessage("Unable to copy link. Sharing link is displayed above.");
    }
  };

  // Filter files based on category
  const filteredFiles = files.filter((file) => {
    return filterCategory === "All" || file.category === filterCategory;
  });

  return (
    <div className="container">
      <nav className="navbar">
        <h2>FileShare</h2>
        <span>File Sharing Portal</span>
      </nav>

      <div className="main-content">
        <h1>Share Your Files Easily</h1>
        <p>Upload, validate and share your files securely.</p>

        {/* Upload Section */}
        <div className="upload-box">
          <h2>Upload Your File</h2>

          <label
            style={{
              display: "block",
              textAlign: "left",
              marginBottom: "10px",
              fontWeight: "bold",
              color: "#172554",
            }}
          >
            Select File Category
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "20px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          >
            <option value="Assignment">Assignment</option>
            <option value="Learning Materials">Learning Materials</option>
            <option value="Notes">Notes</option>
            <option value="Question Papers">Question Papers</option>
          </select>

          {/* Drag and Drop Area */}
          <div
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <p>📁 Drag & Drop your file here</p>
            <p>or</p>

            <label htmlFor="fileInput" className="browse-button">
              Choose File
            </label>

            <input
              id="fileInput"
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <div style={{ marginTop: "15px" }}>
              <p>
                <strong>Selected File:</strong> {selectedFile.name}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={
              isUploading ||
              !selectedFile ||
              !dfaResult.startsWith("Accepted") ||
              !extensionResult.startsWith("Accepted") ||
              !sizeResult.startsWith("Accepted")
            }
            style={{
              opacity:
                isUploading ||
                !selectedFile ||
                !dfaResult.startsWith("Accepted") ||
                !extensionResult.startsWith("Accepted") ||
                !sizeResult.startsWith("Accepted")
                  ? 0.5
                  : 1,
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </button>

          {/* Upload Progress Bar */}
          {(isUploading || uploadProgress > 0) && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>

              <p>
                {isUploading
                  ? `${uploadProgress}% uploaded`
                  : "100% - Upload completed!"}
              </p>
            </div>
          )}

          {message && <p className="message">{message}</p>}
        </div>

        {/* Automatic DFA Validation */}
        <div className="dfa-card">
          <div className="dfa-heading">
            <h2>Automatic DFA Filename Validation</h2>
            <p>Filename is automatically checked when you select a file.</p>
          </div>

          <div className="dfa-rules">
            <h4>Allowed Filename Characters</h4>
            <p>A-Z &nbsp; a-z &nbsp; 0-9 &nbsp; _ &nbsp; -</p>
          </div>

          {selectedFile && (
            <div className="dfa-result">
              <h3>DFA State Transition</h3>

              <p>
                <strong>Filename:</strong> {dfaInput}
              </p>

              <div className="state-flow">
                {dfaStates.map((state, index) => (
                  <React.Fragment key={index}>
                    <span
                      className={`state-box ${
                        state === "q1"
                          ? "accepted-state"
                          : state === "qReject"
                            ? "rejected-state"
                            : ""
                      }`}
                    >
                      {state}
                    </span>

                    {index !== dfaStates.length - 1 && <span>→</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Filename Result */}
              <div
                className={`dfa-status ${
                  dfaResult.startsWith("Accepted")
                    ? "success-status"
                    : "error-status"
                }`}
              >
                {dfaResult.startsWith("Accepted") ? "✓" : "✕"} {dfaResult}
              </div>

              {/* Extension Result */}
              <div
                className={`dfa-status ${
                  extensionResult.startsWith("Accepted")
                    ? "success-status"
                    : "error-status"
                }`}
                style={{ marginTop: "10px" }}
              >
                {extensionResult.startsWith("Accepted") ? "✓" : "✕"}{" "}
                {extensionResult}
              </div>

              {/* File Size Result */}
              <div
                className={`dfa-status ${
                  sizeResult.startsWith("Accepted")
                    ? "success-status"
                    : "error-status"
                }`}
                style={{ marginTop: "10px" }}
              >
                {sizeResult.startsWith("Accepted") ? "✓" : "✕"} {sizeResult}
              </div>
            </div>
          )}

          {!selectedFile && (
            <p style={{ textAlign: "center", margin: "20px" }}>
              Select a file to see automatic DFA validation.
            </p>
          )}

          <div className="dfa-state-info">
            <div>
              <span className="state-dot initial-dot"></span>
              q0 – Initial State
            </div>

            <div>
              <span className="state-dot accept-dot"></span>
              q1 – Accepting State
            </div>

            <div>
              <span className="state-dot reject-dot"></span>
              qReject – Reject State
            </div>
          </div>

          <div className="dfa-table">
            <h3>DFA Transition Table</h3>

            <table>
              <thead>
                <tr>
                  <th>Current State</th>
                  <th>Valid Character</th>
                  <th>Invalid Character</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>q0</td>
                  <td>q1</td>
                  <td>qReject</td>
                </tr>

                <tr>
                  <td>q1</td>
                  <td>q1</td>
                  <td>qReject</td>
                </tr>

                <tr>
                  <td>qReject</td>
                  <td>qReject</td>
                  <td>qReject</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sharing Link Section */}
        {shareLink && (
          <div className="upload-box">
            <h2>Your Sharing Link</h2>

            <p>{shareLink}</p>

            <button onClick={handleCopyLink}>Copy Link</button>

            <br />
            <br />

            <a href={shareLink} target="_blank" rel="noreferrer">
              Open Shared File
            </a>
          </div>
        )}

        {/* Uploaded Files Section */}
        <div className="upload-box">
          <h2>Uploaded Files</h2>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Assignment">Assignment</option>
            <option value="Learning Materials">Learning Materials</option>
            <option value="Notes">Notes</option>
            <option value="Question Papers">Question Papers</option>
          </select>

          {filteredFiles.length === 0 ? (
            <p>No files found in this category.</p>
          ) : (
            <ul>
              {filteredFiles.map((file, index) => (
                <li key={index}>
                  {file.originalName}

                  <p>Category: {file.category || "Not specified"}</p>

                  <p>
                    File Size:{" "}
                    {file.fileSize
                      ? (file.fileSize / 1024).toFixed(2) + " KB"
                      : "N/A"}
                  </p>

                  <p>
                    Upload Date:{" "}
                    {file.uploadDate
                      ? new Date(file.uploadDate).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <a
                    href={`${API}/download/${encodeURIComponent(file.storedName)}`}
                    style={{
                      color: "blue",
                      marginLeft: "15px",
                    }}
                  >
                    Download
                  </a>

                  <button
                    onClick={() => handleShare(file)}
                    style={{ marginLeft: "10px" }}
                  >
                    Share / Copy Link
                  </button>

                  <button
                    onClick={() => handleDelete(file.storedName)}
                    style={{
                      backgroundColor: "red",
                      marginLeft: "10px",
                      padding: "6px 12px",
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
