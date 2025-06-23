const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',     // o la IP de tu servidor MySQL
  user: 'root',          // tu usuario de MySQL
  password: 'muertex2.0',          // tu contraseña de MySQL
  database: 'archiall' // cambia esto por el nombre real
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar con MySQL:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Ruta para registrar usuario
app.post('/createUser', (req, res) => {
  const { Nombre, Correo, Contrasena } = req.body;

  const query = 'INSERT INTO usuario (Nombre, Correo, Contraseña) VALUES (?, ?, ?)';
  db.query(query, [Nombre, Correo, Contrasena], (err, result) => {
    if (err) {
      console.error('Error al insertar nombre:', err);
      return res.status(500).json({ error: 'Error al registrar nombre' });
    }

    console.log('nombre insertado:', result.insertId);
    res.status(201).json({ message: 'nombre registrado exitosamente' });
  });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { Correo, Contrasena } = req.body;

  const query = 'SELECT * FROM usuario WHERE Correo = ? AND Contraseña = ?';
  db.query(query, [Correo, Contrasena], (err, results) => {
    if (err) {
      console.error('Error al hacer login:', err);
      return res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }

    if (results.length > 0) {
      // Usuario encontrado
      return res.status(200).json({ status: 'success', user: results[0] });
    } else {
      // Credenciales inválidas
      return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
    }
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ruta subir archi
app.post('/uploads', upload.single('file'), (req, res) => {
  const { ID_Usuario, ID_Repositorio } = req.body;
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }
  if (!ID_Usuario || !ID_Repositorio) {
    return res.status(400).json({ error: 'Faltan datos de usuario o repositorio' });
  }
  // Guarda la info del archivo en la bd
  const nombre = req.file.originalname;
  const tipo = req.file.mimetype;
  const tamaño = req.file.size;
  const fecha = new Date();
  const ruta = req.file.filename; // Solo el nombre del archivo, no la ruta completa

  const query = `
    INSERT INTO archivo (Nombre, Tipo, Tamaño, Fecha_Subida, Ruta, ID_Usuario, ID_Repositorio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [nombre, tipo, tamaño, fecha, ruta, ID_Usuario, ID_Repositorio],
    (err, result) => {
      if (err) {
        console.error('Error al guardar archivo en la base de datos:', err);
        return res.status(500).json({ error: 'Error al guardar archivo en la base de datos' });
      }
      res.status(200).json({
        message: 'Archivo subido exitosamente',
        filePath: req.file.path,
        archivoId: result.insertId
      });
    }
  );
});

app.get('/archivos/:idRepositorio', (req, res) => {
  const idRepositorio = req.params.idRepositorio;
  const query = 'SELECT * FROM archivo WHERE ID_Repositorio = ?';
  db.query(query, [idRepositorio], (err, results) => {
    if (err) {
      console.error('Error al obtener archivos:', err);
      return res.status(500).json({ error: 'Error al obtener archivos' });
    }
    res.status(200).json(results);
  });
});

app.post('/repositorio', (req, res) => {
  const { Nombre, ID_Usuario } = req.body;
  const query = 'INSERT INTO repositorio (Nombre, Fecha_Creacion, ID_Usuario) VALUES (?, NOW(), ?)';
  db.query(query, [Nombre, ID_Usuario], (err, result) => {
    if (err) {
      console.error('Error al crear repositorio:', err);
      return res.status(500).json({ error: 'Error al crear repositorio' });
    }
    res.status(201).json({ message: 'Repositorio creado exitosamente', idRepositorio: result.insertId });
  });
});

app.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', fileName);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error al descargar el archivo:', err);
      res.status(500).send('Error al descargar el archivo');
    } else {
      console.log('Archivo descargado:', fileName);
    }
  });
});

app.delete('/archivo/:id', (req, res) => {
  const idArchivo = req.params.id;
  const { ruta } = req.body;
  // Elimina de la base de datos
  db.query('DELETE FROM archivo WHERE ID_Archivo = ?', [idArchivo], (err, result) => {
    if (err) {
      console.error('Error al eliminar archivo:', err);
      return res.status(500).json({ error: 'Error al eliminar archivo' });
    }
    // Elimina el archivo físico
    if (ruta) {
      const filePath = path.join(__dirname, 'uploads', ruta);
      fs.unlink(filePath, (err) => {
        // Si hay error al borrar el archivo físico, solo muestra en consola
        if (err) console.error('Error al eliminar archivo físico:', err);
      });
    }
    res.status(200).json({ message: 'Archivo eliminado' });
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
