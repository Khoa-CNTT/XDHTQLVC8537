<<<<<<< HEAD
const express = require("express");
const cors = require("cors")
require('dotenv').config();
const routerUser = require("./src/routes/routeUser");
const routerHH = require("./src/routes/routeHH");
=======
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routerUser = require('./src/routes/routeUser');
const routerHH = require('./src/routes/routeHH');
const routerDH = require('./src/routes/routeDH');
const routerReport = require('./src/routes/routeReport');
const routerPayment = require('./src/routes/routePayment');
const routerNotification = require('./src/routes/routeNotification');
const routeOrder = require('./src/routes/routeOrder');
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
>>>>>>> thong

const app = express();
const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || 'localhost';
<<<<<<< HEAD
app.use(express.json());
app.use(cors());
app.use("/", routerUser);
app.use("/", routerHH);
=======

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api', routerUser); // /api/register, /api/login

// Protected routes
app.use('/api', authMiddleware, routerHH); // /api/hanghoa, /api/loaihh, etc.
app.use('/api', authMiddleware, routerDH); // /api/donhang
app.use('/api', authMiddleware, routerReport); // /api/reports
app.use('/api', authMiddleware, routerPayment); // /api/payments
app.use('/api', authMiddleware, routerNotification); // /api/notifications
app.use('/api', authMiddleware, routeOrder);


// Error handling middleware - should be added after all routes
app.use(errorHandler);

>>>>>>> thong
app.listen(port, hostname, () => {
    console.log(`Server listening at http://${hostname}:${port}`);
});