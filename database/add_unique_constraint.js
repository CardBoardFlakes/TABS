const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database/data_source.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    return;
  }
  console.log("Connected to the database.");
});

db.all("SELECT * FROM Faction", (err, existingRows) => {
  if (err && !err.message.includes("no such table")) {
    console.error("Error reading existing data:", err.message);
    db.close();
    return;
  }

  db.run("DROP TABLE IF EXISTS Faction", (err) => {
    if (err) {
      console.error("Error dropping table:", err.message);
      db.close();
      return;
    }
    console.log("Old table dropped.");

    db.run(`
      CREATE TABLE Faction (
        FactionID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL UNIQUE,
        Theme TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
        db.close();
        return;
      }
      console.log("Faction table recreated with UNIQUE constraint on Name.");

      if (existingRows && existingRows.length > 0) {
        let inserted = 0;
        let skipped = 0;
        let index = 0;

        existingRows.forEach((row) => {
          db.run(
            "INSERT INTO Faction (Name, Theme) VALUES (?, ?)",
            [row.Name, row.Theme],
            function(err) {
              if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                  skipped++;
                  console.log(`Skipped duplicate: ${row.Name} - ${row.Theme}`);
                } else {
                  console.error(`Error inserting ${row.Name}:`, err.message);
                }
              } else {
                inserted++;
              }

              index++;
              if (index === existingRows.length) {
                console.log(`\nMigration complete: ${inserted} rows inserted, ${skipped} duplicates skipped.`);
                
                db.all("SELECT * FROM Faction", (err, rows) => {
                  if (err) {
                    console.error("Error reading data:", err.message);
                  } else {
                    console.log("\nCurrent Faction data:");
                    console.table(rows);
                  }
                  db.close();
                });
              }
            }
          );
        });
      } else {
        console.log("No existing data to migrate.");
        db.close();
      }
    });
  });
});

