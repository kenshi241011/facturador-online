const { Pool } = require('pg');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const comprobante = JSON.parse(event.body);
        const { id, fecha, hora, total, items } = comprobante;

        const query = 'INSERT INTO comprobantes(id, fecha, hora, total, items) VALUES($1, $2, $3, $4, $5)';
        await pool.query(query, [id, fecha, hora, total, JSON.stringify(items)]);
        
        await pool.end();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Comprobante guardado' }),
        };
    } catch (error) {
        console.error("Database Error:", error);
        await pool.end();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Fallo al guardar el comprobante.' }),
        };
    }
};