const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ejs = require("ejs");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT ||3012;


app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(__dirname + "/views"));
app.set("view engine", "ejs");

app.use('/', require('./Routes/paymentRoute'));


app.listen(PORT, () => {
    console.log("Running on " + PORT);
});
