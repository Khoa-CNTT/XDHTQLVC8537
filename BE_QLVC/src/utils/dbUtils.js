const { connection } = require('../config/database');

/**
 * Execute a database query with transaction support
 * @param {Function} callback - Function that receives connection and executes queries
 * @returns {Promise<any>} Result from the callback
 */
const executeTransaction = async (callback) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const result = await callback(conn);

        await conn.commit();
        return result;
    } catch (error) {
        if (conn) await conn.rollback();
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

/**
 * Execute a simple database query
 * @param {string} sql - SQL query to execute 
 * @param {Array} params - Parameters for the query
 * @returns {Promise<any>} Query result
 */
const executeQuery = async (sql, params = []) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [result] = await conn.query(sql, params);
        return result;
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    executeTransaction,
    executeQuery
};
