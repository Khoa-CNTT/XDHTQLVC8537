const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10000,
    queueLimit: 0,
    timezone: '+07:00', // Set timezone to UTC+7 for Vietnam time
    // Thêm cấu hình có độ ưu tiên cao hơn để đảm bảo múi giờ đúng
    connectionInitSql: "SET time_zone='+07:00';"
})

module.exports = {
    connection,
}