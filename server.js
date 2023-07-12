const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000'
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgres://default:LO1wdI2GgHWV@ep-tiny-limit-795119.us-east-1.postgres.vercel-storage.com:5432/verceldb",
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/data-account", (req, res) => {
  const sql = "SELECT * FROM data_account";

  pool.query(sql, (err, result) => {
    if (err) {
      console.error("Gagal menjalankan query:", err);
      return res.json(err);
    } else {
      return res.json(result.rows);
    }
  });
});

app.get("/data-account", (req, res) => {
  const sql = "SELECT * FROM raksasa_db.data_account";
  pool.query(sql, (err, data) => {
    if (err) {
      console.error("Gagal menjalankan query:", err);
      return res.json(err);
    } else {
      return res.json(data.rows);
    }
  });
});

app.get("/list-nilai", (req, res) => {
  const sql = "SELECT * FROM raksasa_db.nilai_siswa";
  pool.query(sql, (err, data) => {
    if (err) {
      console.error("Gagal menjalankan query:", err);
      return res.json(err);
    } else {
      return res.json(data.rows);
    }
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const searchSql = "SELECT * FROM data_account WHERE username = $1";
  const selectUser = [username];

  pool.query(searchSql, selectUser, (err, result) => {
    if (err) {
      console.error("Gagal mencari data:", err);
      res.status(500).json({ message: "Gagal mencari data" });
    } else {
      if (result.rows.length > 0) {
        console.log("akun ada");
        res.status(200).json({ success: true, message: "Login berhasil" });
      } else {
        console.log("akun tidak ada");
        res.status(200).json({
          success: false,
          message: "Nama pengguna atau password salah",
        });
      }
    }
  });
});

app.post("/searchAccount", (req, res) => {
  const { username } = req.body;
  const searchSql = "SELECT id FROM data_account WHERE username = $1";
  const searchUser = [username];

  pool.query(searchSql, searchUser, (err, result) => {
    if (err) {
      console.error("Gagal mencari data:", err);
      res.status(500).json({ message: "Gagal mencari data" });
    } else {
      const data = result.rows.map((row) => row.id);
      res.status(200).json(data);
    }
  });
});

app.post("/data-account", (req, res) => {
  const { username, password } = req.body;

  const sql = `
    WITH new_account AS (
  INSERT INTO data_account (username, password)
  VALUES ($1, $2)
  RETURNING id
  )
  INSERT INTO data_note (id_user, note_1, note_2, note_3, note_4)
  SELECT id, '', '', '', ''
  FROM new_account;
  `;
  const values = [username, password];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal menambahkan data:", err);
      res.status(500).json({ message: "Gagal menambahkan data" });
    } else {
      console.log("Data berhasil ditambahkan");
      res.status(200).json({ message: "Data berhasil ditambahkan" });
    }
  });
});

app.get("/user-nilai-siswa", (req, res) => {
  const { username, filterKelas } = req.query;

  let sql = `
    SELECT ns.nama, ns.nilai, ns.kelas
    FROM nilai_siswa ns
    INNER JOIN data_account da ON ns.guru_pembimbing = da.id
    WHERE da.username = $1
  `;
  let values = [username];

  if (filterKelas) {
    sql += " AND ns.kelas = $2";
    values.push(filterKelas);
  }

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal mengambil data nilai siswa:", err);
      res.status(500).json({ message: "Gagal mengambil data nilai siswa" });
    } else {
      console.log("Data nilai siswa berhasil diambil");
      res.status(200).json(result.rows);
    }
  });
});

app.post("/data-nilai", (req, res) => {
  const { nama, kelas, userId, nilai } = req.body;

  const checkSql = "SELECT * FROM nilai_siswa WHERE nama = $1 AND nilai = $2";
  const checkValues = [nama, nilai];

  pool.query(checkSql, checkValues, (err, result) => {
    if (err) {
      console.error("Gagal memeriksa data:", err);
      res.status(500).json({ message: "Gagal memeriksa data" });
    } else {
      if (result.rows.length > 0) {
        // Data sudah pernah diinput sebelumnya
        console.log("Data sudah pernah diinput sebelumnya");
        res
          .status(400)
          .json({ message: "Data sudah pernah diinput sebelumnya" });
      } else {
        const sql =
          "INSERT INTO nilai_siswa (nama, kelas, guru_pembimbing, nilai) VALUES ($1, $2, $3, $4)";
        const values = [nama, kelas, userId, nilai];

        pool.query(sql, values, (err, result) => {
          if (err) {
            console.error("Gagal menambahkan data:", err);
            res.status(500).json({ message: "Gagal menambahkan data" });
          } else {
            console.log("Data berhasil ditambahkan");
            res.status(200).json({ message: "Data berhasil ditambahkan" });
          }
        });
      }
    }
  });
});

app.get("/user-pdf-make", (req, res) => {
  const { username, filterKelas } = req.query;

  let sql = `
    SELECT ns.nama, ns.nilai, ns.kelas
    FROM nilai_siswa ns
    INNER JOIN data_account da ON ns.guru_pembimbing = da.id
    WHERE da.username = $1
  `;
  let values = [username];

  if (filterKelas) {
    sql += " AND ns.kelas = $2";
    values.push(filterKelas);
  }

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal mengambil data nilai siswa:", err);
      res.status(500).json({ message: "Gagal mengambil data nilai siswa" });
    } else {
      // Membuat dokumen PDF baru
      const doc = new PDFDocument();

      // Menentukan nama file PDF yang akan diunduh
      const filename = "data_nilai_siswa1.pdf";

      // Mengatur header HTTP agar file diunduh sebagai attachment
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      // Mengalihkan output PDF ke respons HTTP
      doc.pipe(res);

      // Membuat halaman PDF
      doc.fontSize(18).text("Data Nilai Siswa", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Username: ${username}`);
      doc.moveDown();

      result.rows.forEach((row, index) => {
        doc.fontSize(12).text(`Nama Siswa: ${row.nama}`);
        doc.fontSize(12).text(`Nilai Siswa: ${row.nilai}`);
        doc.moveDown();
      });

      // Selesai membuat PDF
      doc.end();
    }
  });
});

app.get("/user-note", (req, res) => {
  const { username } = req.query;

  const sql = `
    SELECT da.username, dn.note_1, dn.note_2, dn.note_3, dn.note_4
    FROM data_account da
    LEFT JOIN data_note dn ON da.id = dn.id_user
    WHERE da.username = $1;
  `;
  const values = [username];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal mengambil data nilai siswa:", err);
      res.status(500).json({ message: "Gagal mengambil data nilai siswa" });
    } else {
      res.json(result.rows);
    }
  });
});

app.post("/input-user-note", (req, res) => {
  const { username, numNote, textNote } = req.body;
  console.log(textNote);

  let sql = "";

  if (numNote === "1") {
    sql = `
      UPDATE data_note 
      SET note_1 = $1 
      FROM data_account 
      WHERE data_note.id_user = data_account.id AND data_account.username = $2;
    `;
  } else if (numNote === "2") {
    sql = `
      UPDATE data_note 
      SET note_2 = $1 
      FROM data_account 
      WHERE data_note.id_user = data_account.id AND data_account.username = $2;
    `;
  } else if (numNote === "3") {
    sql = `
      UPDATE data_note 
      SET note_3 = $1 
      FROM data_account 
      WHERE data_note.id_user = data_account.id AND data_account.username = $2;
    `;
  } else if (numNote === "4") {
    sql = `
      UPDATE data_note 
      SET note_4 = $1 
      FROM data_account 
      WHERE data_note.id_user = data_account.id AND data_account.username = $2;
    `;
  }
  const values = [textNote, username];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal mengambil data nilai siswa:", err);
      res.status(500).json({ message: "Gagal mengambil data nilai siswa" });
    } else {
      res.json(result.rows);
    }
  });
});


app.post("/login-sustenalia", (req, res) => {
  const { useremail, password } = req.body;
  const searchSql = "SELECT * FROM data_akun_sustenalia WHERE email = $1";
  const selectUser = [useremail];

  pool.query(searchSql, selectUser, (err, result) => {
    if (err) {
      console.error("Gagal mencari data:", err);
      res.status(500).json({ message: "Gagal mencari data" });
    } else {
      if (result.rows.length > 0) {
        console.log("akun ada");
        res.status(200).json({ success: true, message: "Login berhasil" });
      } else {
        console.log("akun tidak ada");
        res.status(200).json({
          success: false,
          message: "Nama pengguna atau password salah",
        });
      }
    }
  });
});

app.post("/add-akun-sustenalia", (req, res) => {
  const { username, useremail, password } = req.body;

  const sql = "INSERT INTO data_akun_sustenalia (nama, email, password) VALUES ($1, $2, $3);"
  const values = [username, useremail, password];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Gagal menambahkan data:", err);
      res.status(500).json({ message: "Gagal menambahkan data" });
    } else {
      console.log("Data berhasil ditambahkan");
      res.status(200).json({ message: "Data berhasil ditambahkan" });
    }
  });
});

app.get("/", (req, res) => {
  return res.json("succesfull 1");
});

app.listen(process.env.PORT, () => {
  console.log("listening");
});
