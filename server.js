const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static('.'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para criar a tabela se ela não existir
async function createTable() {
    const client = await pool.connect();
    try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS leituras (
            id SERIAL PRIMARY KEY,
            valor INTEGER NOT NULL,
            data_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log("Tabela 'leituras' verificada/criada com sucesso.");
    } catch(err) {
        console.error("Erro ao criar a tabela:", err);
    } finally {
        client.release();
    }
}
// Chama a função para garantir que a tabela exista ao iniciar
createTable();


app.post('/api/dados-sensor', async (req, res) => {
  const { valor } = req.body;
  if (valor === undefined) {
    return res.status(400).json({ error: 'O campo "valor" é obrigatório.' });
  }
  try {
    const result = await pool.query('INSERT INTO leituras (valor) VALUES ($1) RETURNING id', [valor]);
    console.log(`Dado inserido com ID: ${result.rows[0].id}`);
    res.status(201).json({ message: 'Dado recebido com sucesso!', id: result.rows[0].id });
  } catch (err) {
    console.error("Erro ao inserir no banco:", err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/api/dados-historicos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leituras ORDER BY data_hora DESC LIMIT 100');
    res.json(result.rows.reverse());
  } catch (err) {
    console.error("Erro ao consultar o banco:", err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
