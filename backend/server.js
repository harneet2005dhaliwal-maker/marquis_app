const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/students", (req, res) => {
  res.json([]);
});

app.get("/api/classes", (req, res) => {
  res.json([]);
});

app.get("/api/enrollments", (req, res) => {
  res.json([]);
});

app.listen(5001, () => {
  console.log("Backend running on http://localhost:5001");
});