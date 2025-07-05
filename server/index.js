
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Rutas principales
app.use('/', require('./routes/userRoutes'));
app.use('/', require('./routes/uploadRoutes'));
app.use('/', require('./routes/repoRoutes'));
app.use('/', require('./routes/shareRoutes'));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
