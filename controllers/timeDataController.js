const Datastore = require('nedb');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Determine an appropriate base directory for the databases
// This example uses a directory named 'myAppData' within the user's home directory, which should work across different OSes
const baseDir = path.join(os.homedir(), 'myAppData', 'databases');

// Ensure the base directory exists or create it
if (!fs.existsSync(baseDir)){
    fs.mkdirSync(baseDir, { recursive: true });
}

// Create Datastore instances with absolute paths
let TimeData = new Datastore({ filename: path.join(baseDir, 'timeData.db'), autoload: true });
let AllTime = new Datastore({ filename: path.join(baseDir, 'allTime.db'), autoload: true });




function getDayId(dateString) {
  const [day, month, year] = dateString.split("/");
  return parseInt(`${year}${month}${day}`);
}

function formatDateTime(dateTime) {
  return dateTime.toLocaleString("en-GB", {
    hour12: true,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

let sessionStartTime = new Date();

exports.getIndex = async (req, res) => {
  const currentTime = new Date();

  // Instead of resetting at 11:59:59 PM, let the day naturally roll over to 00:00:00
  if (
    currentTime.getDate() !== sessionStartTime.getDate() ||
    currentTime.getMonth() !== sessionStartTime.getMonth() ||
    currentTime.getFullYear() !== sessionStartTime.getFullYear()
  ) {
    // The new sessionStartTime will be set at the start of the new day automatically
    sessionStartTime = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate()
    );
    totalSeconds = 0; // Reset total seconds for the new session
  } else {
    // Calculate totalSeconds normally
    totalSeconds = Math.floor((currentTime - sessionStartTime) / 1000);
  }

  const lastCheckedTime = formatDateTime(currentTime);

  try {
    // Check if a session already exists for the current day
    const sessionStartTimeFormatted = formatDateTime(sessionStartTime);
    const existingSession = await new Promise((resolve, reject) => {
      TimeData.findOne({ sessionStartTime: sessionStartTimeFormatted }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });

    if (existingSession) {
      // Update existing session normally
      await new Promise((resolve, reject) => {
        TimeData.update({ _id: existingSession._id }, { $set: { totalSeconds, lastCheckedTime } }, {}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      // Make sure we're not just before midnight to avoid creating a session that should belong to the next day
      if (!(currentTime.getHours() === 23 && currentTime.getMinutes() === 59 && currentTime.getSeconds() === 59)) {
        // Create a new session only if it's not the last second of the day
        await new Promise((resolve, reject) => {
          TimeData.insert({
            sessionStartTime: sessionStartTimeFormatted,
            totalSeconds,
            lastCheckedTime,
          }, (err, newDoc) => {
            if (err) reject(err);
            else resolve(newDoc);
          });
        });
      }
    }

    res.json({
      totalSeconds,
      sessionStartTime: sessionStartTimeFormatted,
      lastCheckedTime,
    });
  } catch (error) {
    res.status(500).send("Error processing request: " + error.message);
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const allSessions = await new Promise((resolve, reject) => {
      TimeData.find({}, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });

    res.json(allSessions);
  } catch (error) {
    res.status(500).send("Error retrieving data: " + error.message);
  }
};

// exports.getAlltime = async (req, res) => {
//   try {
//     const allSessions = await new Promise((resolve, reject) => {
//       TimeData.find({}, (err, docs) => {
//         if (err) reject(err);
//         else resolve(docs);
//       });
//     });

//     const processedSessions = {};
//     allSessions.forEach((session) => {
//       const dateKey = session.sessionStartTime.split(", ")[0];
//       if (!processedSessions[dateKey]) {
//         processedSessions[dateKey] = {
//           dayid: getDayId(dateKey),
//           starttime: session.sessionStartTime,
//           totaltime: session.totalSeconds,
//           lasttime: session.lastCheckedTime,
//         };
//       } else {
//         processedSessions[dateKey].totaltime += session.totalSeconds;
//         // Assume lasttime update logic is correct or adjust as necessary
//         processedSessions[dateKey].lasttime = session.lastCheckedTime;
//       }
//     });

//     // Since NeDB doesn't support findOneAndUpdate directly, we manually implement upsert logic
//     for (const [dateKey, data] of Object.entries(processedSessions)) {
//       await new Promise((resolve, reject) => {
//         AllTime.update({ dayid: data.dayid }, { $set: data }, { upsert: true }, (err) => {
//           if (err) reject(err);
//           else resolve();
//         });
//       });
//     }

//     res.json(Object.values(processedSessions));
//   } catch (error) {
//     res.status(500).send("Error processing data: " + error.message);
//   }
// };
// exports.getAlltime = async (req, res) => {
//   try {
//     // Find all sessions in the database
//     TimeData.find({}, (err, sessions) => {
//       if (err) {
//         // Handle error
//         res.status(500).send('Error retrieving data');
//         return;
//       }

//       // If there are no sessions, return an empty response
//       if (!sessions || sessions.length === 0) {
//         res.json({ starttime: null, lasttime: null, totaltime: 0 });
//         return;
//       }

//       // Sort sessions by sessionStartTime
//       sessions.sort((a, b) => new Date(a.sessionStartTime) - new Date(b.sessionStartTime));

//       // Get the start time from the first session and the last checked time from the last session
//       const starttime = sessions[0].sessionStartTime;
//       const lasttime = sessions[sessions.length - 1].lastCheckedTime;

//       // Sum up all totalSeconds
//       const totaltime = sessions.reduce((acc, session) => acc + session.totalSeconds, 0);

//       // Send the aggregated data
//       res.json({ starttime, lasttime, totaltime });
//     });
//   } catch (error) {
//     // Handle any other errors
//     res.status(500).send('Error processing data: ' + error.message);
//   }
// };



// exports.getAlltime = async (req, res) => {
//   try {
//     // Find all sessions in the database
//     TimeData.find({}, (err, sessions) => {
//       if (err) {
//         // Handle error
//         res.status(500).send('Error retrieving data');
//         return;
//       }

//       // If there are no sessions, return an empty response
//       if (!sessions || sessions.length === 0) {
//         res.json({ dayid: null, starttime: null, lasttime: null, totaltime: 0 });
//         return;
//       }

//       // Sort sessions by sessionStartTime
//       sessions.sort((a, b) => new Date(a.sessionStartTime) - new Date(b.sessionStartTime));

//       // Get the start time from the first session and the last checked time from the last session
//       const starttime = sessions[0].sessionStartTime;
//       const lasttime = sessions[sessions.length - 1].lastCheckedTime;

//       // Calculate dayid from the first sessionStartTime
//       const dayid = getDayId(starttime.split(", ")[0]);

//       // Sum up all totalSeconds
//       const totaltime = sessions.reduce((acc, session) => acc + session.totalSeconds, 0);

//       // Send the aggregated data
//       res.json({ dayid, starttime, lasttime, totaltime });
//     });
//   } catch (error) {
//     // Handle any other errors
//     res.status(500).send('Error processing data: ' + error.message);
//   }
// };
























































// exports.getAlltime = async (req, res) => {
//   try {
//     TimeData.find({}, (err, sessions) => {
//       if (err) {
//         res.status(500).send('Error retrieving data');
//         return;
//       }

//       if (sessions.length === 0) {
//         res.json({ dayid: null, starttime: null, lasttime: null, totaltime: 0 });
//         return;
//       }

//       sessions.sort((a, b) => new Date(a.sessionStartTime) - new Date(b.sessionStartTime));

//       const starttime = sessions[0].sessionStartTime;
//       const lasttime = sessions[sessions.length - 1].lastCheckedTime;
//       const dayid = getDayId(starttime.split(", ")[0]);
//       const totaltime = sessions.reduce((acc, session) => acc + session.totalSeconds, 0);

//       // Upsert the aggregated data into AllTime
//       AllTime.update(
//         { dayid: dayid },
//         { $set: { dayid: dayid, starttime: starttime, totaltime: totaltime, lasttime: lasttime } },
//         { upsert: true },
//         (err, numReplaced, upsert) => {
//           if (err) {
//             res.status(500).send('Error updating all time data');
//             return;
//           }
//           res.json({ dayid, starttime, lasttime, totaltime });
//         }
//       );
//     });
//   } catch (error) {
//     res.status(500).send('Error processing data: ' + error.message);
//   }
// };


























exports.getAlltime = async (req, res) => {
  try {
    TimeData.find({}, (err, sessions) => {
      if (err) {
        res.status(500).send('Error retrieving data');
        return;
      }

      if (sessions.length === 0) {
        res.json([]);
        return;
      }

      // Group sessions by dayid
      const groupedByDay = sessions.reduce((acc, session) => {
        const dayid = getDayId(session.sessionStartTime.split(", ")[0]);
        if (!acc[dayid]) {
          acc[dayid] = {
            dayid: dayid,
            starttime: session.sessionStartTime,
            lasttime: session.lastCheckedTime,
            totaltime: session.totalSeconds
          };
        } else {
          acc[dayid].totaltime += session.totalSeconds;
          if (new Date(session.lastCheckedTime) > new Date(acc[dayid].lasttime)) {
            acc[dayid].lasttime = session.lastCheckedTime;
          }
          if (new Date(session.sessionStartTime) < new Date(acc[dayid].starttime)) {
            acc[dayid].starttime = session.sessionStartTime;
          }
        }
        return acc;
      }, {});

      // Convert groupedByDay object to an array
      const dailySummaries = Object.values(groupedByDay).map(day => ({
        dayid: day.dayid,
        starttime: day.starttime,
        lasttime: day.lasttime,
        totaltime: day.totaltime
      }));

      // Upsert each day's aggregated data into AllTime
      dailySummaries.forEach(day => {
        AllTime.update(
          { dayid: day.dayid },
          { $set: day },
          { upsert: true },
          (err) => {
            if (err) {
              res.status(500).send('Error updating all time data');
              return;
            }
          }
        );
      });

      res.json(dailySummaries);
    });
  } catch (error) {
    res.status(500).send('Error processing data: ' + error.message);
  }
};
