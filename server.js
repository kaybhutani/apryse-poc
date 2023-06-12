const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const signDocumentFunction = require("./signingService");
const app = express();
const upload = multer({ dest: "uploads/" });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const filePath = file.path;

  fs.readFile(filePath, async (err, data) => {
    if (err) {
      console.error(err);
      return res.send("Error reading file");
    }

    const buffer = Buffer.from(data);
    const mimeType = file.mimetype;
    console.log(buffer);
    // Do something with the buffer and mimeType
    await signDocumentFunction(buffer);
    res.send("File uploaded successfully!");
  });
});
app.use((req, res) => {
  res.redirect("/");
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
