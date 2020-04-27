const express = require("express");
const cors = require("cors");
const monk = require("monk");
const Filter = require("bad-words");
const rateLimit = require("express-rate-limit");

const db = monk(process.env.MONOG_URL || "localhost/meower");
const mews = db.get("mews"); //collection in mongodb
const filter = new Filter();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Mewoer! 😹 ",
  });
});

app.get("/mews", (req, res) => {
  mews.find().then((mews) => res.json(mews));
});

const isValidMew = (mew) => {
  return (
    mew.name &&
    mew.name.toString().trim() !== "" &&
    mew.content &&
    mew.content.toString().trim() !== ""
  );
};

app.use(
  rateLimit({
    windowMs: 30 * 1000,
    max: 1,
  })
);

app.post("/mews", (req, res) => {
  if (isValidMew(req.body)) {
    //insert to DB
    const mew = {
      name: filter.clean(req.body.name.toString()),
      content: filter.clean(req.body.content.toString()),
      created: new Date(),
    };
    mews.insert(mew).then((createdMew) => {
      res.json(createdMew);
    });
  } else {
    res.status(422);
    res.json({ message: "Hey! Name and Content are required" });
  }
});

app.listen(PORT, () =>
  console.log("server is running up on http://localhost:5000")
);
