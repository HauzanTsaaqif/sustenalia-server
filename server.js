const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const pdfFonts = require('pdfmake/build/vfs_fonts');

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://default:LO1wdI2GgHWV@ep-tiny-limit-795119.us-east-1.postgres.vercel-storage.com:5432/verceldb',
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/data-account', (req, res) => {
  const sql = 'SELECT * FROM data_account';
  
  pool.query(sql, (err, result) => {
    if (err) {
      console.error('Gagal menjalankan query:', err);
      return res.json(err);
    } else {
      return res.json(result.rows);
    }
  });
});

app.get('/', (req, res) => {
    return res.json("succesfull");
})
<<<<<<< HEAD

app.listen(3306, () =>{
    console.log("listening");
})
=======
>>>>>>> 24953c9d85899884a27d7b8244cc1898f76190dc
