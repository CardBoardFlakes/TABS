/*
this is the SQL archive with all the SQL Quieries I have used in this projects

CREATE TABLE extension(extID INTEGER NOT NULL PRIMARY KEY,name TEXT NOT NULL, hyperlink TEXT NOT NULL,about TEXT NOT NULL,image TEXT NOT NULL,language TEXT NOT NULL);

INSERT INTO extension(extID,name,hyperlink,about,image,language) VALUES 
(1,"Live Server","https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer","Launch a development local Server with live reload feature for static & dynamic pages","https://ritwickdey.gallerycdn.vsassets.io/extensions/ritwickdey/liveserver/5.7.9/1736542717282/Microsoft.VisualStudio.Services.Icons.Default","HTML CSS JS");

INSERTNSERT INTO extension(extID,name,hyperlink,about,image,language) VALUES 
(2,"Render CR LF","https://marketplace.visualstudio.com/items?itemName=medo64.render-crlf","Displays the line ending symbol and optionally extra whitespace when 'Render whitespace' is turned on.","https://medo64.gallerycdn.vsassets.io/extensions/medo64/render-crlf/1.7.1/1689315206970/Microsoft.VisualStudio.Services.Icons.Default","#BASH");

INSERT INTO extension(extID,name,hyperlink,about,image,language) VALUES 
(3,"Start GIT BASH","https://marketplace.visualstudio.com/items?itemName=McCarter.start-git-bash","Adds a bash command to VSCode that allows you to start git-bash in the current workspace's root folder.","https://mccarter.gallerycdn.vsassets.io/extensions/mccarter/start-git-bash/1.2.1/1499505567572/Microsoft.VisualStudio.Services.Icons.Default","#BASH");

INSERT INTO extension(extID,name,hyperlink,about,image,language) VALUES 
(4,"SQLite3 Editor","https://marketplace.visualstudio.com/items?itemName=yy0931.vscode-sqlite3-editor","Edit SQLite3 files like you would in spreadsheet applications.","https://yy0931.gallerycdn.vsassets.io/extensions/yy0931/vscode-sqlite3-editor/1.0.85/1690893830873/Microsoft.VisualStudio.Services.Icons.Default","SQL");


CREATE TABLE IF NOT EXISTS Units (
    UnitID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Cost TEXT NOT NULL,
    Health TEXT NOT NULL,
    Speed TEXT NOT NULL
);

INSERT INTO Units (Name, Cost, Health, Speed) VALUES ('Clubber', '70', '80', '1');
SELECT * FROM Units;

CREATE TABLE IF NOT EXISTS Faction (
    UnitID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Theme TEXT NOT NULL,
);

INSERT INTO Faction (Name, Theme) VALUES ('Tribal', 'Stone Age');
SELECT * FROM Faction;


CREATE TABLE IF NOT EXISTS FactionUnits (
    FactionID INTEGER NOT NULL,
    UnitID INTEGER NOT NULL,
    PRIMARY KEY (FactionID, UnitID),
    FOREIGN KEY (FactionID) REFERENCES Faction(FactionID),
    FOREIGN KEY (UnitID) REFERENCES Units(UnitID)
);

INSERT INTO FactionUnits (FactionID, UnitID) VALUES (1, 1);
SELECT * FROM FactionUnits;

SELECT * from Music;
*/