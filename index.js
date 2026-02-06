const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database/data_source.db");
const fs =require("fs");

let myString = "[\n";
db.all("SELECT * FROM extension", function (err, rows) {
  let myCounter = 0;
  rows.forEach(function (row) {
    // for debugging
    // console.log(row.extID + ": " + row.name + ": " + row.hyperlink + ": " + row.about + ": " + row.image + ": " + row.language);
    myString =
      myString +
      '{\n"extID":' +
      row.extID +
      ',\n"name":"' +
      row.name +
      '",\n"hyperlink":"' +
      row.hyperlink +
      '",\n"about":"' +
      row.about +
      '",\n"image":"' +
      row.image +
      '",\n"language":"' +
      row.language;
    myCounter++;
    if (myCounter == rows.length) {
      myString = myString + '"\n}\n';
    } else {
      myString = myString + '"\n},\n';
    }
  });

  // console.log(myString);
  var fs = require("fs");
  fs.writeFile("public/frontEndData.json", myString + "]", function (err) {
    if (err) {
      console.log(err);
    }
  });
});

// Insert additional backend js above the express server configuration

const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.listen(5000, () =>
  console.log(
    "Server is running on Port 5000, visit http://localhost:5000/ to access your website"
  )
);

let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // For JSON API requests

app.get("/add.html", function (req, res) {
  res.sendFile(path.join(__dirname, "public/add.html"));
});

// Ensure Faction table exists
db.run(`
  CREATE TABLE IF NOT EXISTS Faction (
    FactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Theme TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Error creating Faction table:", err.message);
  } else {
    console.log("Faction table ready.");
  }
});

// Ensure Units table exists
db.run(`
  CREATE TABLE IF NOT EXISTS Units (
    UnitID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Cost TEXT NOT NULL,
    Health TEXT NOT NULL,
    Speed TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error("Error creating Units table:", err.message);
  } else {
    console.log("Units table ready.");
  }
});

// Ensure FactionUnits junction table exists
db.run(`
  CREATE TABLE IF NOT EXISTS FactionUnits (
    FactionID INTEGER NOT NULL,
    UnitID INTEGER NOT NULL,
    PRIMARY KEY (FactionID, UnitID),
    FOREIGN KEY (FactionID) REFERENCES Faction(FactionID),
    FOREIGN KEY (UnitID) REFERENCES Units(UnitID)
  )
`, (err) => {
  if (err) {
    console.error("Error creating FactionUnits table:", err.message);
  } else {
    console.log("FactionUnits table ready.");
  }
});

// API endpoint for adding Factions or Units
app.post("/api/add", function (req, res) {
  const { type, name, theme, cost, health, speed } = req.body;

  if (!type || !name) {
    return res.json({
      success: false,
      message: "Type and name are required."
    });
  }

  if (type === "faction") {
    // Validate faction data
    if (!theme) {
      return res.json({
        success: false,
        message: "Theme is required for factions."
      });
    }

    // Insert faction
    db.run(
      "INSERT INTO Faction (Name, Theme) VALUES (?, ?)",
      [name, theme],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.json({
              success: false,
              message: `A faction with the name "${name}" already exists.`
            });
          }
          console.error("Error inserting faction:", err.message);
          return res.json({
            success: false,
            message: "An error occurred while saving the faction."
          });
        }
        res.json({
          success: true,
          message: `Faction "${name}" with theme "${theme}" has been added successfully!`
        });
      }
    );
  } else if (type === "unit") {
    // Validate unit data
    if (!cost || !health || !speed) {
      return res.json({
        success: false,
        message: "Cost, Health, and Speed are required for units."
      });
    }

    // Insert unit
    db.run(
      "INSERT INTO Units (Name, Cost, Health, Speed) VALUES (?, ?, ?, ?)",
      [name, cost, health, speed],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.json({
              success: false,
              message: `A unit with the name "${name}" already exists.`
            });
          }
          console.error("Error inserting unit:", err.message);
          return res.json({
            success: false,
            message: "An error occurred while saving the unit."
          });
        }
        res.json({
          success: true,
          message: `Unit "${name}" has been added successfully!`
        });
      }
    );
  } else {
    res.json({
      success: false,
      message: "Invalid type. Must be 'faction' or 'unit'."
    });
  }
});

// Simple helper to fetch all rows from a table
function fetchAll(table, columns = "*") {
  const query = `SELECT ${columns} FROM ${table}`;
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
}

// API endpoint to retrieve all factions and units for front-end viewing
app.get("/api/list", async function (req, res) {
  try {
    const [factions, units, factionUnits] = await Promise.all([
      fetchAll("Faction", "FactionID, Name, Theme"),
      fetchAll("Units", "UnitID, Name, Cost, Health, Speed"),
      new Promise((resolve, reject) => {
        db.all(
          `SELECT FU.FactionID, FU.UnitID, F.Name as FactionName, U.Name as UnitName
           FROM FactionUnits FU
           JOIN Faction F ON F.FactionID = FU.FactionID
           JOIN Units U ON U.UnitID = FU.UnitID`,
          [],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      }),
    ]);

    res.json({
      success: true,
      factions,
      units,
      factionUnits,
    });
  } catch (err) {
    console.error("Error fetching data:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to load data from the database.",
    });
  }
});

// API endpoint for deleting Factions or Units
app.post("/api/delete", function (req, res) {
  const { type, id } = req.body;

  if (!type || !id) {
    return res.status(400).json({
      success: false,
      message: "Type and id are required.",
    });
  }

  const idInt = parseInt(id, 10);
  if (isNaN(idInt)) {
    return res.status(400).json({
      success: false,
      message: "Id must be a valid number.",
    });
  }

  if (type === "faction") {
    // First, get the faction name for the response
    db.get(
      "SELECT Name FROM Faction WHERE FactionID = ?",
      [idInt],
      function (err, row) {
        if (err) {
          console.error("Error fetching faction:", err.message);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch faction information.",
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: "Faction not found.",
          });
        }

        const factionName = row.Name;

        // Delete all FactionUnits relationships for this faction first
        db.run(
          "DELETE FROM FactionUnits WHERE FactionID = ?",
          [idInt],
          function (err) {
            if (err) {
              console.error("Error deleting faction units:", err.message);
              return res.status(500).json({
                success: false,
                message: "Failed to remove unit assignments from faction.",
              });
            }

            // Now delete the faction
            db.run(
              "DELETE FROM Faction WHERE FactionID = ?",
              [idInt],
              function (err) {
                if (err) {
                  console.error("Error deleting faction:", err.message);
                  return res.status(500).json({
                    success: false,
                    message: "Failed to delete faction.",
                  });
                }

                res.json({
                  success: true,
                  message: `Faction "${factionName}" has been deleted successfully.`,
                });
              }
            );
          }
        );
      }
    );
  } else if (type === "unit") {
    // First, get the unit name for the response
    db.get(
      "SELECT Name FROM Units WHERE UnitID = ?",
      [idInt],
      function (err, row) {
        if (err) {
          console.error("Error fetching unit:", err.message);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch unit information.",
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: "Unit not found.",
          });
        }

        const unitName = row.Name;

        // Delete all FactionUnits relationships for this unit first
        db.run(
          "DELETE FROM FactionUnits WHERE UnitID = ?",
          [idInt],
          function (err) {
            if (err) {
              console.error("Error deleting unit assignments:", err.message);
              return res.status(500).json({
                success: false,
                message: "Failed to remove faction assignments from unit.",
              });
            }

            // Now delete the unit
            db.run(
              "DELETE FROM Units WHERE UnitID = ?",
              [idInt],
              function (err) {
                if (err) {
                  console.error("Error deleting unit:", err.message);
                  return res.status(500).json({
                    success: false,
                    message: "Failed to delete unit.",
                  });
                }

                res.json({
                  success: true,
                  message: `Unit "${unitName}" has been deleted successfully.`,
                });
              }
            );
          }
        );
      }
    );
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid type. Must be 'faction' or 'unit'.",
    });
  }
});

// Add or remove a unit from a faction
app.post("/api/faction-units", function (req, res) {
  const { factionId, unitId, action } = req.body;

  if (!factionId || !unitId || !["add", "remove"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "factionId, unitId, and action ('add' or 'remove') are required.",
    });
  }

  // Convert to integers to ensure proper type handling
  const factionIdInt = parseInt(factionId, 10);
  const unitIdInt = parseInt(unitId, 10);

  if (isNaN(factionIdInt) || isNaN(unitIdInt)) {
    return res.status(400).json({
      success: false,
      message: "factionId and unitId must be valid numbers.",
    });
  }

  if (action === "add") {
    // First check if the relationship already exists
    db.get(
      "SELECT 1 FROM FactionUnits WHERE FactionID = ? AND UnitID = ?",
      [factionIdInt, unitIdInt],
      function (err, row) {
        if (err) {
          console.error("Error checking existing relationship:", err.message);
          return res.status(500).json({
            success: false,
            message: "Failed to check existing relationship.",
          });
        }
        
        if (row) {
          return res.json({
            success: true,
            message: "Unit is already assigned to this faction.",
          });
        }

        // Insert the new relationship
        db.run(
          "INSERT INTO FactionUnits (FactionID, UnitID) VALUES (?, ?)",
          [factionIdInt, unitIdInt],
          function (err) {
            if (err) {
              console.error("Error linking faction and unit:", err.message);
              return res.status(500).json({
                success: false,
                message: "Failed to link unit to faction.",
              });
            }
            res.json({
              success: true,
              message: "Unit added to faction successfully.",
            });
          }
        );
      }
    );
  } else if (action === "remove") {
    db.run(
      "DELETE FROM FactionUnits WHERE FactionID = ? AND UnitID = ?",
      [factionIdInt, unitIdInt],
      function (err) {
        if (err) {
          console.error("Error unlinking faction and unit:", err.message);
          return res.status(500).json({
            success: false,
            message: "Failed to remove unit from faction.",
          });
        }
        res.json({
          success: true,
          message: "Unit removed from faction successfully.",
        });
      }
    );
  }
});

db.all("SELECT * FROM Music", (err, rows) => {
  if (err) return console.error(err);
  fs.writeFileSync("public/mfrontEndData.json", JSON.stringify(rows, null, 2));
});
app.get("/music", (req, res) => {
  res.sendFile(path.join(__dirname, "public/music.html"));
});