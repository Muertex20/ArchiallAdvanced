const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.post('/createUser', async (req, res) => {
  const { Nombre, Correo, Contrasena } = req.body;
  try {
    const hash = await bcrypt.hash(Contrasena, 10);
    const query = 'INSERT INTO usuario (Nombre, Correo, Contraseña, Rol) VALUES (?, ?, ?, ?)';
    db.query(query, [Nombre, Correo, hash, 'usuario'], (err, result) => {
      if (err) {
        console.error('Error al insertar nombre:', err);
        return res.status(500).json({ error: 'Error al registrar nombre' });
      }

      const idUsuario = result.insertId;
      // Crea el repositorio automáticamente
      const repoQuery = 'INSERT INTO repositorio (Nombre, Fecha_Creacion, ID_Usuario) VALUES (?, NOW(), ?)';
      db.query(repoQuery, [`Repositorio de ${Nombre}`, idUsuario], (err2) => {
        if (err2) {
          console.error('Error al crear repositorio:', err2);
          return res.status(500).json({ error: 'Usuario creado pero error al crear repositorio' });
        }
        res.status(201).json({ message: 'Usuario y repositorio creados exitosamente' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al hashear contraseña' });
  }
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { Correo, Contrasena } = req.body;
  const query = 'SELECT * FROM usuario WHERE Correo = ?';
  db.query(query, [Correo], async (err, results) => {
    if (err) {
      console.error('Error al hacer login:', err);
      return res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
    if (results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(Contrasena, user.Contraseña);
      if (match) {
        return res.status(200).json({ status: 'success', user });
      } else {
        return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
      }
    } else {
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

// Obtener las cosas agregadas por el usuario
app.get('/perfil/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT FotoPerfil, Descripcion, Baneado, Nombre FROM usuario WHERE ID_Usuario = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener perfil' });
    res.json(results[0]);
  });
});

// Actualiza el perfil del usuario
app.post('/perfil/:id', (req, res) => {
  const id = req.params.id;
  const { FotoPerfil, Descripcion, Nombre } = req.body;

  // Construye el query dinámicamente según los campos enviados
  let fields = [];
  let values = [];

  if (FotoPerfil !== undefined) {
    fields.push('FotoPerfil = ?');
    values.push(FotoPerfil);
  }
  if (Descripcion !== undefined) {
    fields.push('Descripcion = ?');
    values.push(Descripcion);
  }
  if (Nombre !== undefined && Nombre !== "") {
    fields.push('Nombre = ?');
    values.push(Nombre);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  values.push(id);

  const query = `UPDATE usuario SET ${fields.join(', ')} WHERE ID_Usuario = ?`;
  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar perfil' });
    res.json({ status: 'success' });
  });
});

// Ruta para obtener los usuarios y mostrarlos en "Compartir"
app.get('/usuarios', (req, res) => {
  db.query(
    'SELECT ID_Usuario, Nombre, Correo, Rol, Baneado, FotoPerfil, Descripcion FROM usuario',
    (err, results) => {
      if (err) {
        console.error('Error al obtener usuarios:', err);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      res.status(200).json(results);
    }
  );
});
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
  const idUsuario = req.query.user;
  if (!idUsuario) {
    return res.status(400).json({ error: 'Falta el parámetro de usuario' });
  }
  const query = 'SELECT * FROM archivo WHERE ID_Repositorio = ? AND ID_Usuario = ?';
  db.query(query, [idRepositorio, idUsuario], (err, results) => {
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

  db.query('SELECT Nombre FROM archivo WHERE Ruta = ?', [fileName], (err, results) => {
    if (err || results.length === 0) {
      console.error('No se encontró el archivo en la base de datos:', err);
      return res.status(404).send('Archivo no encontrado');
    }
    const nombreOriginal = results[0].Nombre;
    res.download(filePath, nombreOriginal, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send('Error al descargar el archivo');
      } else {
        console.log('Archivo descargado:', nombreOriginal);
      }
    });
  });
});

app.delete('/archivo/:id', (req, res) => {
  const idArchivo = req.params.id;
  const { ruta } = req.body;

  // 1. Obtén la ruta del archivo antes de eliminar el registro
  db.query('SELECT Ruta FROM archivo WHERE ID_Archivo = ?', [idArchivo], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    const rutaArchivo = results[0].Ruta;

    // 2. Elimina el registro de la tabla archivo
    db.query('DELETE FROM archivo WHERE ID_Archivo = ?', [idArchivo], (err, result) => {
      if (err) {
        console.error('Error al eliminar archivo:', err);
        return res.status(500).json({ error: 'Error al eliminar archivo' });
      }

      // 3. Verifica si hay más registros usando la misma ruta
      db.query('SELECT COUNT(*) AS count FROM archivo WHERE Ruta = ?', [rutaArchivo], (err, results) => {
        if (err) {
          console.error('Error al verificar archivos restantes:', err);
          return res.status(500).json({ error: 'Error al verificar archivos restantes' });
        }
        if (results[0].count === 0) {
          // 4. Si nadie más lo tiene, elimina el archivo físico
          const filePath = path.join(__dirname, 'uploads', rutaArchivo);
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error al eliminar archivo físico:', err);
          });
        }
        res.status(200).json({ message: 'Archivo eliminado' });
      });
    });
  });
});
// Ruta para compartir archivos
app.post('/compartir-archivos', (req, res) => {
  const { idUsuarioRemite, idUsuarioDestino, archivos } = req.body;
  const fecha = new Date();
  if (!idUsuarioRemite || !idUsuarioDestino || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para compartir archivos' });
  }
  const values = archivos.map(idArchivo => [
    idArchivo,
    idUsuarioDestino,
    idUsuarioRemite,
    fecha,
    'pendiente'
  ]);
  db.query(
    'INSERT INTO comparticion (ID_Archivo, ID_Usuario_Destino, ID_Usuario_Remite, Fecha_Comparticion, Estado) VALUES ?',
    [values],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al compartir archivos' });
      res.json({ status: 'success' });
    }
  );
});
// Ruta para obtener archivos compartidos pendientes
app.get('/archivos-compartidos-pendientes/:idUsuario', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const query = `
    SELECT c.ID_Archivo, a.Nombre AS NombreArchivo, u.Nombre AS NombreRemitente
    FROM comparticion c
    JOIN archivo a ON c.ID_Archivo = a.ID_Archivo
    JOIN usuario u ON c.ID_Usuario_Remite = u.ID_Usuario
    WHERE c.ID_Usuario_Destino = ? AND c.Estado = 'pendiente'
  `;
  db.query(query, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener archivos compartidos' });
    res.json(results);
  });
});
// Ruta para aceptar archivos compartidos
app.post('/aceptar-archivos-compartidos', (req, res) => {
  const { idUsuario, archivos } = req.body;
  if (!idUsuario || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para aceptar archivos' });
  }
  // Genera los placeholders correctos
  const placeholders = archivos.map(() => '?').join(',');
  const paramsUpdate = [idUsuario, ...archivos];

  // UPDATE
  const updateQuery = `UPDATE comparticion SET Estado = "aceptado" WHERE ID_Usuario_Destino = ? AND ID_Archivo IN (${placeholders})`;
  console.log('UPDATE:', updateQuery, paramsUpdate);
  db.query(updateQuery, paramsUpdate, (err) => {
    if (err) {
      console.error('ERROR DETALLADO:', err);
      return res.status(500).json({ error: 'Error al aceptar archivos', detalle: err });
    }
    // SELECT
    db.query(
      'SELECT ID_Repositorio FROM repositorio WHERE ID_Usuario = ? LIMIT 1',
      [idUsuario],
      (err, repoResults) => {
        if (err || repoResults.length === 0) {
          console.error('No se encontró el repositorio del usuario destino:', err);
          return res.status(500).json({ error: 'No se encontró el repositorio del usuario destino' });
        }
        const idRepositorioDestino = repoResults[0].ID_Repositorio;

        const selectQuery = `SELECT * FROM archivo WHERE ID_Archivo IN (${placeholders})`;
        console.log('SELECT:', selectQuery, archivos);
        db.query(selectQuery, archivos, (err, archivosResults) => {
          if (err) {
            console.error('Error al obtener archivos originales:', err);
            return res.status(500).json({ error: 'Error al obtener archivos originales', detalle: err });
          }
          // Prepara los nuevos registros para insertar
          const nuevosArchivos = archivosResults.map(archivo => [
            archivo.Nombre,
            archivo.Tipo,
            archivo.Tamaño,
            new Date(),
            archivo.Ruta,
            idUsuario,
            idRepositorioDestino
          ]);

          // Insertar los archivos en el repositorio del usuario destino
          db.query(
            `INSERT INTO archivo (Nombre, Tipo, Tamaño, Fecha_Subida, Ruta, ID_Usuario, ID_Repositorio) VALUES ?`,
            [nuevosArchivos],
            (err, insertResult) => {
              if (err) {
                console.error('Error al copiar archivos al repositorio destino:', err);
                return res.status(500).json({ error: 'Error al copiar archivos al repositorio destino', detalle: err });
              }
              // insertResult.insertId es el primer ID insertado, y los IDs son consecutivos
              const nuevosIds = [];
              for (let i = 0; i < nuevosArchivos.length; i++) {
                nuevosIds.push(insertResult.insertId + i);
              }
              // Actualiza la tabla comparticion para que apunte a los nuevos archivos
              // (uno por uno, porque no hay un update masivo fácil)
              let updates = 0;
              for (let i = 0; i < archivos.length; i++) {
                db.query(
                  'UPDATE comparticion SET ID_Archivo = ? WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? AND Estado = "aceptado"',
                  [nuevosIds[i], idUsuario, archivos[i]],
                  (err) => {
                    updates++;
                    if (updates === archivos.length) {
                      // Obtener una noti si el remitente acepto los archivos
                      db.query(
                        'SELECT ID_Usuario_Remite FROM comparticion WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? LIMIT 1',
                        [idUsuario, nuevosIds[0]],
                        (err2, result) => {
                          if (!err2 && result.length > 0) {
                            const idRemitente = result[0].ID_Usuario_Remite;
                            db.query(
                              'INSERT INTO notificacion (ID_Usuario, Mensaje) VALUES (?, ?)',
                              [idRemitente, `Tus archivos fueron aceptados por el usuario destino.`]
                            );
                          }
                          res.json({ status: 'success' });
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        });
      }
    );
  });
});
// Ruta para rechazar archivos compartidos
app.post('/rechazar-archivos-compartidos', (req, res) => {
  const { idUsuario, archivos } = req.body;
  if (!idUsuario || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para rechazar archivos' });
  }
  const placeholders = archivos.map(() => '?').join(',');
  const params = [idUsuario, ...archivos];
  const updateQuery = `UPDATE comparticion SET Estado = "rechazado" WHERE ID_Usuario_Destino = ? AND ID_Archivo IN (${placeholders})`;
  db.query(updateQuery, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al rechazar archivos' });

    db.query(
      'SELECT ID_Usuario_Remite FROM comparticion WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? LIMIT 1',
      [idUsuario, archivos[0]],
      (err2, result) => {
        if (!err2 && result.length > 0) {
          const idRemitente = result[0].ID_Usuario_Remite;
          db.query(
            'INSERT INTO notificacion (ID_Usuario, Mensaje) VALUES (?, ?)',
            [idRemitente, `Tus archivos fueron rechazados por el usuario destino.`]
          );
        }
        res.json({ status: 'success' });
      }
    );
  });
});
// Ruta para obtener el repositorio de un usuario
app.get('/repositorio-usuario/:idUsuario', (req, res) => {
  const idUsuario = req.params.idUsuario;
  db.query('SELECT ID_Repositorio FROM repositorio WHERE ID_Usuario = ? LIMIT 1', [idUsuario], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'No se encontró el repositorio' });
    res.json(results[0]);
  });
});

app.get('/notificaciones/:idUsuario', (req, res) => {
  const idUsuario = req.params.idUsuario;
  db.query('SELECT * FROM notificacion WHERE ID_Usuario = ? AND Leida = 0', [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener notificaciones' });
    res.json(results);
  });
});

app.post('/notificacion-leida/:id', (req, res) => {
  db.query('UPDATE notificacion SET Leida = 1 WHERE ID_Notificacion = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al marcar como leída' });
    res.json({ status: 'ok' });
  });
});
// Acciones dentro del panel de administrador
// Primero elimina todo lo que tiene el user y luego lo elimina a este
app.delete('/usuario/:id', (req, res) => {
  const idUsuario = req.params.id;

  // 1. Elimina archivos del usuario
  db.query('DELETE FROM archivo WHERE ID_Usuario = ?', [idUsuario], (err) => {
    if (err) {
      console.error('Error al eliminar archivos del usuario:', err);
      return res.status(500).json({ error: 'Error al eliminar archivos del usuario' });
    }

    // 2. Elimina repositorio del usuario
    db.query('DELETE FROM repositorio WHERE ID_Usuario = ?', [idUsuario], (err2) => {
      if (err2) {
        console.error('Error al eliminar repositorio del usuario:', err2);
        return res.status(500).json({ error: 'Error al eliminar repositorio del usuario' });
      }

      // 3. Elimina el usuario
      db.query('DELETE FROM usuario WHERE ID_Usuario = ?', [idUsuario], (err3) => {
        if (err3) {
          console.error('Error al eliminar usuario:', err3);
          return res.status(500).json({ error: 'Error al eliminar usuario' });
        }
        res.json({ status: 'success', message: 'Usuario y datos relacionados eliminados' });
      });
    });
  });
});
// Cambiar rol de usuario
app.put('/usuario/:id/rol', (req, res) => {
  const idUsuario = req.params.id;
  const { rol } = req.body;
  db.query('UPDATE usuario SET Rol = ? WHERE ID_Usuario = ?', [rol, idUsuario], (err, result) => {
    if (err) {
      console.error('Error al cambiar rol:', err);
      return res.status(500).json({ error: 'Error al cambiar rol' });
    }
    res.json({ status: 'success', message: 'Rol actualizado' });
  });
});
// Banear usuario
app.put('/usuario/:id/ban', (req, res) => {
  const idUsuario = req.params.id;
  const { baneado } = req.body;
  db.query('UPDATE usuario SET Baneado = ? WHERE ID_Usuario = ?', [baneado ? 1 : 0, idUsuario], (err, result) => {
    if (err) {
      console.error('Error al banear usuario:', err);
      return res.status(500).json({ error: 'Error al banear usuario' });
    }
    res.json({ status: 'success', message: 'Usuario baneado' });
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
