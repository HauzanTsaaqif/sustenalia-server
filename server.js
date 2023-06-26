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
  const sql = 'SELECT * FROM raksasa_db.data_account';
  
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

app.get('/data-account', (req, res) =>{
    const sql = "SELECT * FROM raksasa_db.data_account";
    db.query(sql, (err, data) =>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.get('/list-nilai', (req, res) =>{
    const sql = "SELECT * FROM raksasa_db.nilai_siswa";
    db.query(sql, (err, data) =>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.get('/user-nilai-siswa', (req, res) => {
  const { username, filterKelas } = req.query;

  let sql = `
    SELECT ns.nama, ns.nilai, ns.kelas
    FROM raksasa_db.nilai_siswa ns
    INNER JOIN raksasa_db.data_account da ON ns.guru_pembimbing = da.id
    WHERE da.username = ?
  `;
  let values = [username];

  if (filterKelas) {
    sql += ' && ns.kelas = ?';
    values.push(filterKelas);
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Gagal mengambil data nilai siswa:', err);
      res.status(500).json({ message: 'Gagal mengambil data nilai siswa' });
    } else {
      console.log('Data nilai siswa berhasil diambil');
      res.status(200).json(result);
    }
  });
});



app.post('/searchAccount', (req, res) => {
    const { username } = req.body;
    const searchSql = 'SELECT id FROM data_account WHERE username = ?';
    const searchUser = [username];
  
    db.query(searchSql, searchUser, (err, result) => {
      if (err) {
        console.error('Gagal mencari data:', err);
        res.status(500).json({ message: 'Gagal mencari data' });
      } else {
        const data = result.map(row => row.id);
        res.status(200).json(data);
      }
    });
  });
  

app.post('/data-account', (req, res) => {
    const { username, password } = req.body;
  
    // Membuat query untuk memasukkan data ke database
    const sql = 'INSERT INTO raksasa_db.data_account (username, password) VALUES (?, ?)';
    const values = [username, password];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Gagal menambahkan data:', err);
        res.status(500).json({ message: 'Gagal menambahkan data' });
      } else {
        console.log('Data berhasil ditambahkan');
        res.status(200).json({ message: 'Data berhasil ditambahkan' });
      }
    });
  });
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const searchSql = 'SELECT * FROM raksasa_db.data_account WHERE username = ?';
    const selectUser = [username];
  
    db.query(searchSql, selectUser, (err, result) => {
      if (err) {
        console.error('Gagal mencari data:', err);
        res.status(500).json({ message: 'Gagal mencari data' });
      } else {
        if (result.length > 0 ){
            console.log("akun ada");
            res.status(200).json({ success: true, message: 'Login berhasil' });
        }else{
            console.log("akun tidak ada");
            res.status(200).json({ success: false, message: 'Nama pengguna atau password salah' });
        }
      }
    });
  });  

  app.post('/data-nilai', (req, res) => {
    const { nama, kelas, userId, nilai } = req.body;

    const checkSql = 'SELECT * FROM raksasa_db.nilai_siswa WHERE nama = ? AND nilai = ?';
    const checkValues = [nama, nilai];
  
    db.query(checkSql, checkValues, (err, result) => {
        if (err) {
            console.error('Gagal memeriksa data:', err);
            res.status(500).json({ message: 'Gagal memeriksa data' });
          }else {
            if (result.length > 0) {
                // Data sudah pernah diinput sebelumnya
                console.log('Data sudah pernah diinput sebelumnya');
                res.status(400).json({ message: 'Data sudah pernah diinput sebelumnya' });
              }else{
                const sql = 'INSERT INTO raksasa_db.nilai_siswa (nama, kelas, guru_pembimbing, nilai) VALUES (?, ?, ?, ?);';
                const values = [nama, kelas, userId, nilai ];
            
                db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Gagal menambahkan data:', err);
                    res.status(500).json({ message: 'Gagal menambahkan data' });
                } else {
                    console.log('Data berhasil ditambahkan');
                    res.status(200).json({ message: 'Data berhasil ditambahkan' });
                }
                });
              }
          }
    });

    
  });

  

app.get('/user-pdf-make', (req, res) => {
  const { username, filterKelas } = req.query;

  let sql = `
    SELECT ns.nama, ns.nilai, ns.kelas
    FROM raksasa_db.nilai_siswa ns
    INNER JOIN raksasa_db.data_account da ON ns.guru_pembimbing = da.id
    WHERE da.username = ?
  `;
  let values = [username];

  if (filterKelas) {
    sql += ' && ns.kelas = ?';
    values.push(filterKelas);
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Gagal mengambil data nilai siswa:', err);
      res.status(500).json({ message: 'Gagal mengambil data nilai siswa' });
    } else {
      // Membuat dokumen PDF baru
      const doc = new PDFDocument();

      // Menentukan nama file PDF yang akan diunduh
      const filename = 'data_nilai_siswa.pdf';

      // Mengatur header HTTP agar file diunduh sebagai attachment
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');

      // Mengalihkan output PDF ke respons HTTP
      doc.pipe(res);

      // Membuat halaman PDF
      doc.fontSize(18).text('Data Nilai Siswa', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Username: ${username}`);
      doc.moveDown();

      result.forEach((row, index) => {
        doc.fontSize(12).text(`Nama Siswa: ${row.nama}`);
        doc.fontSize(12).text(`Nilai Siswa: ${row.nilai}`);
        doc.moveDown();
      });

      // Selesai membuat PDF
      doc.end();
    }
  });
});

app.get('/user-note', (req, res) => {
  const { username } = req.query;

  const sql = `
    SELECT da.username, dn.note_1, dn.note_2, dn.note_3, dn.note_4
    FROM data_account da
    LEFT JOIN data_note dn ON da.id = dn.id_user
    WHERE da.username = ?;
  `;
  const values = [username];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Gagal mengambil data nilai siswa:', err);
      res.status(500).json({ message: 'Gagal mengambil data nilai siswa' });
    } else {
      res.json(result);
    }
  });
});

app.post('/input-user-note', (req, res) => {
  const { username, numNote, textNote  } = req.body;
  console.log(textNote);

  let sql = '';

  if (numNote === '1'){sql = `UPDATE data_note INNER JOIN data_account ON data_note.id_user = data_account.id SET data_note.note_1 = ? WHERE data_account.username = ?;`;}
  if (numNote === '2'){sql = `UPDATE data_note INNER JOIN data_account ON data_note.id_user = data_account.id SET data_note.note_2 = ? WHERE data_account.username = ?;`;}
  if (numNote === '3'){sql = `UPDATE data_note INNER JOIN data_account ON data_note.id_user = data_account.id SET data_note.note_3 = ? WHERE data_account.username = ?;`;}
  if (numNote === '4'){sql = `UPDATE data_note INNER JOIN data_account ON data_note.id_user = data_account.id SET data_note.note_4 = ? WHERE data_account.username = ?;`;}
  const values = [textNote, username];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Gagal mengambil data nilai siswa:', err);
      res.status(500).json({ message: 'Gagal mengambil data nilai siswa' });
    } else {
      res.json(result);
    }
  });
});

app.listen(3306, () =>{
    console.log("listening");
})