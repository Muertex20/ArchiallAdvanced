const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'muertex2.0',
  database: 'archiall'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar con MySQL:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

module.exports = db;
