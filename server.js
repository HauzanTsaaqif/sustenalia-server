const express = require('express');
const { db } = require('@vercel/postgres');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', async (req, res) => {
  const client = await db.connect();

  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS Pets (Name varchar(255), Owner varchar(255));`
    );

    const names = ['Fiona', 'Lucy'];
    await client.query(
      `INSERT INTO Pets (Name, Owner) VALUES ($1, $2);`,
      names
    );

    const result = await client.query(`SELECT * FROM Pets;`);
    const pets = result.rows;

    return res.json({ pets });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
