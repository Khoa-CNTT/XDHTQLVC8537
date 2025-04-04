const express = require("express");
const cors = require("cors")
require('dotenv').config();
const routerUser = require("./src/routes/routeUser");
const routerHH = require("./src/routes/routeHH");

const app = express();
const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || 'localhost';
app.use(express.json());
app.use(cors());
app.use("/", routerUser);
app.use("/", routerHH);
app.listen(port, hostname, () => {
    console.log(`Server listening at http://${hostname}:${port}`);
});