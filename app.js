const express = require("express");
const cors = require("cors");
const Datastore = require("nedb");
const http = require("http");
const app = express();
const port = 5000;
const server = http.createServer(app);
const { exec } = require("child_process");
const os = require('os');
const path = require('path');
const fs = require('fs');
// PowerShell command to list processes with their CPU usage

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Initialize NeDB Datastores with paths to the database files


// Determine an appropriate base directory for the databases
// This example uses a directory within the user's home directory for cross-platform compatibility
const baseDir = path.join(os.homedir(), 'myAppData', 'databases');

// Ensure the base directory exists or create it
if (!fs.existsSync(baseDir)){
    fs.mkdirSync(baseDir, { recursive: true });
}

// Initialize your databases with absolute paths
const db = {};
db.schools = new Datastore({
  filename: path.join(baseDir, 'schools.db'),
  autoload: true,
});
db.videos = new Datastore({
  filename: path.join(baseDir, 'videos.db'),
  autoload: true,
});


// Make the Datastores accessible through the app
app.locals.db = db;

// Routes
const indexRouter = require("./routes/index");
app.use("/", indexRouter);


function getTaskList() {
    return new Promise((resolve, reject) => {
      const command = 'tasklist ';
  
      exec(command, { maxBuffer: 1024 * 5000 }, (err, stdout, stderr) => {
        if (err) {
          reject(`exec error: ${err}`);
          return;
        }
        resolve(stdout);
      });
    });
  }
  
  function getRecentList() {
    return new Promise((resolve, reject) => {
      const powershellCommand = `powershell -command "Get-ChildItem -Path 'C:\\Users\\Lenovo\\AppData\\Roaming\\Microsoft\\Windows\\Recent' | Select-Object Name,CPU"`;
  
      exec(powershellCommand, (err, stdout, stderr) => {
        if (err) {
          reject(`Error executing PowerShell command: ${err}`);
          return;
        }
        if (stderr) {
          reject(`PowerShell stderr: ${stderr}`);
          return;
        }
        resolve(stdout);
      });
    });
  }


//   app.get('/tasklist', async (req, res) => {
//     try {
//       const taskList = await getTaskList();
//       res.json({ taskList });
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   });
  
//   // Recent List Route
//   app.get('/recent-list', async (req, res) => {
//     try {
//       const recentList = await getRecentList();
//       res.json({ recentList });
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   });

app.get('/tasklist', async (req, res) => {
    try {
        const taskList = await getTaskList();
        res.json({ success: true, data: taskList.split('\n').map(line => line.trim()) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/recent-list', async (req, res) => {
    try {
        const recentList = await getRecentList();
        res.json({ success: true, data: recentList.split('\n').map(item => item.trim()) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


server.listen(port);
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log(
      `Port ${port} is already in use. The server is not starting again.`
    );
  } else {
    console.error(`An error occurred: ${e.message}`);
  }
});

server.on("listening", () => {
  console.log(`Server started at http://localhost:${port}`);
});
