const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
<<<<<<< HEAD
    connectionLimit: 10,
=======
    connectionLimit: 1000,
>>>>>>> thong
    queueLimit: 0
})

module.exports = {
    connection,
}