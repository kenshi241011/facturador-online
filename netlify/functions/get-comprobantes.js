const { Pool } = require('pg');

exports.handler = async function(event, context) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const { rows } = await pool.query('SELECT * FROM comprobantes ORDER BY id DESC;');
        await pool.end();
        return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(rows),
        };
    } catch (error) {
        console.error("Database Error:", error);
        await pool.end();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Fallo al obtener los datos.' }),
        };
    }
};