live link : https://file-sharing-portal-project.vercel.app
# File Sharing Portal with File Name and Extension Validation

## 1. Project Description

The File Sharing Portal is a web-based application that allows users to upload, share, download and delete files.

The system validates filenames using a Deterministic Finite Automaton (DFA) and checks file extensions before allowing uploads.

## 2. Objectives

- To provide a simple file-sharing platform.
- To validate filenames using DFA.
- To restrict unsupported file extensions.
- To store file information in MongoDB.
- To generate unique sharing links for uploaded files.

## 3. Technologies Used

### Frontend

- HTML
- CSS
- JavaScript
- React.js
- Axios

### Backend

- Node.js
- Express.js
- Multer

### Database

- MongoDB Atlas

## 4. Main Features

1. File Upload
2. Filename Validation using DFA
3. File Extension Validation
4. View Uploaded Files
5. File Download
6. Unique File Sharing Links
7. Delete Uploaded Files
8. Display File Size and Upload Date

## 5. File Validation

### Allowed Filename Characters

- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Underscore (\_)
- Hyphen (-)

### Allowed File Extensions

- .pdf
- .docx
- .txt
- .jpg
- .jpeg
- .png

## 6. Subjects Integrated

### Computer Networks (CN)

- Client-server architecture
- HTTP communication
- Request and response methods
- File transfer between client and server

### Formal Languages and Automata Theory (FLAT)

- Deterministic Finite Automaton (DFA)
- States and transitions
- Accept and reject states
- Regular language-based filename validation

### Full Stack Web Development (FSWD)

- React.js frontend
- Node.js and Express.js backend
- MongoDB database connectivity
- CRUD operations

## 7. Project Structure

```text
file-sharing-portal/
│
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── server/
│   ├── models/
│   │   └── FileModel.js
│   ├── routes/
│   │   └── uploadRoutes.js
│   ├── uploads/
│   ├── .env
│   └── server.js
│
└── README.md
```

## 8. How to Run the Project

### Backend

```bash
cd server
npm install
node server.js
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 9. Expected Outcome

The application allows users to upload valid files, rejects invalid filenames and unsupported extensions, stores file metadata in MongoDB, and provides unique sharing links for downloading files.

## 10. Conclusion

The File Sharing Portal demonstrates the integration of Computer Networks, Formal Languages and Automata Theory, and Full Stack Web Development in a practical application.
