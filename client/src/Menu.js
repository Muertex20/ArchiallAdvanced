import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import './style/Navbar.css';
import './style/Menu.css';

const Navbar = () => {
  const [vistaActual, setVistaActual] = useState("bienvenida");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const idUsuario = 1;
  const idRepositorio = 1;
  const [archivos, setArchivos] = useState([]); // Archivos en la carpeta actual
  const [carpetaActual] = useState(null); // ID de la carpeta actual
  const [previewUrl, setPreviewUrl] = useState(null);
  //const [carpetas, setCarpetas] = useState([]);

  // useEffect(() => {
  //   cargarCarpetas();
  //   cargarArchivos(null); // null para raíz
  // }, []);

  // const crearCarpeta = async (nombre) => {
  //   await Axios.post('http://localhost:3001/repositorio', {
  //     Nombre: nombre,
  //     ID_Usuario: idUsuario
  //   });
  //   cargarCarpetas();
  // };

  // const cargarCarpetas = async () => {
  //   const res = await Axios.get(`http://localhost:3001/repositorios/${idUsuario}`);
  //   setCarpetas(res.data);
  // };

  const cargarArchivos = async (idRepositorio) => {
    const res = await Axios.get(`http://localhost:3001/archivos/${idRepositorio || 0}`);
    setArchivos(res.data);
  };

  const handleVisualizar = (archivo) => {
    // Solo muestra preview si es imagen
    const esImagen = archivo.Tipo && archivo.Tipo.startsWith('image');
    if (esImagen) {
      setPreviewUrl(`http://localhost:3001/uploads/${archivo.Ruta}`);
    } else {
      setPreviewUrl(null);
      setUploadMessage('Solo se pueden previsualizar imágenes.');
    }
  };

  const handleEliminar = async (idArchivo, ruta) => {
    if (!window.confirm('¿Seguro que deseas eliminar este archivo?')) return;
    try {
      await Axios.delete(`http://localhost:3001/archivo/${idArchivo}`, { data: { ruta } });
      setUploadMessage('Archivo eliminado');
      cargarArchivos(idRepositorio);
    } catch (err) {
      setUploadMessage('Error al eliminar archivo');
    }
  };

  useEffect(() => {
    if (vistaActual === "Mi repositorio") {
      cargarArchivos(idRepositorio);
    }
  }, [vistaActual, idRepositorio]);

  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => {
        setUploadMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadMessage]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleCancel = () => {
    if (!selectedFile) {
      setUploadMessage('No hay archivo para cancelar');
      return;
    }
    setSelectedFile(null);
    setUploadMessage('Archivo cancelado');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage('Selecciona un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('ID_Usuario', idUsuario);
    formData.append('ID_Repositorio', idRepositorio);

    try {
      await Axios.post('http://localhost:3001/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage('Archivo subido exitosamente');
      setSelectedFile(null);
      cargarArchivos(carpetaActual); // <-- Aquí actualizas la lista de archivos
    } catch (err) {
      setUploadMessage('Error al subir archivo');
    }
  };

  const renderContenido = () => {
    switch (vistaActual) {
      case "bienvenida":
        return <p className='Desing-conteiner'>¡Bienvenido a Archiall! aqui podras subir y compartir
          variedad de archivos los cuales te serviran para tu estudio y trabajo en equipo
          y poder acceder a ellos desde cualquier lugar y en cualquier momento.
        </p>;
      case "subir":
        return (
          <div className="Desing-conteiner">
            <h2>Subir archivo</h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="upload-box" onClick={() => document.getElementById('fileInput').click()}>
                <div className="icon-container">
                  <div className="circle">
                    <svg className="download-icon" xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 96 960 960" width="40" fill="#00ff00">
                      <path d="M480 776q-9 0-17-3.5t-15-9.5L301 617q-13-13-13-31t13-31q13-13 31-13t31 13l87 87V344q0-18 12-30t30-12q18 0 30 12t12 30v298l87-87q13-13 31-13t31 13q13 13 13 31t-13 31L512 763q-7 6-15 9.5t-17 3.5ZM240 936q-36 0-60-24t-24-60V696q0-18 12-30t30-12q18 0 30 12t12 30v156h480V696q0-18 12-30t30-12q18 0 30 12t12 30v156q0 36-24 60t-60 24H240Z" />
                    </svg>
                  </div>
                  <p className="upload-text">Seleccione su archivo</p>
                </div>
              </div>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                className="hidden-input"
              />
              {selectedFile && (
                <div className="file-preview">
                  <span className="file-name">{selectedFile.name}</span>
                </div>
              )}
              <div className="buttons-container">
                <button type="submit" className="submit-button">Subir</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancelar</button>
              </div>
            </form>
            {uploadMessage && <p>{uploadMessage}</p>}
          </div>
        );
      case "compartir":
        return <p className='Desing-conteiner'>Comparte tus documentos con otros usuario y compañeros.</p>;
      case "Mi repositorio":
        return (
          <div className="Desing-conteiner">
            <h2>Mi Repositorio</h2>
            <table className="repo-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivos.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ height: '120px', textAlign: 'center', color: '#00ff00' }}>
                      No hay archivos en tu repositorio.
                    </td>
                  </tr>
                ) : (
                  archivos.map((archivo) => (
                    <tr key={archivo.ID_Archivo}>
                      <td>{archivo.Nombre}</td>
                      <td>
                        <button onClick={() => handleVisualizar(archivo)}>Visualizar</button>
                        <button onClick={() => handleEliminar(archivo.ID_Archivo, archivo.Ruta)}>Eliminar</button>
                        <button onClick={() => window.open(`http://localhost:3001/download/${archivo.Ruta}`, '_blank')}>Descargar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {previewUrl && (
              <div style={{ marginTop: '20px' }}>
                <h3>Vista previa</h3>
                <img src={previewUrl} alt="Vista previa" style={{ maxWidth: '400px', maxHeight: '300px', border: '2px solid #00ff00', boxShadow: '0 0 20px #00ff00' }} />
                <br />
                <button onClick={() => setPreviewUrl(null)}>Cerrar vista previa</button>
              </div>
            )}
          </div>
        );
      case "Acerca de":
        return <p className='Desing-conteiner'>Esta es una app creada por Archiall Team.</p>;
      default:
        return <h2 className='Desing-conteiner'>Vista no encontrada</h2>;
    }
  };

  return (
    <>
      <nav className="navbar">
        <ul className="navbar-links">
          <li><button onClick={() => setVistaActual("bienvenida")}>Bienvenida</button></li>
          <li><button onClick={() => setVistaActual("subir")}>Subir</button></li>
          <li><button onClick={() => setVistaActual("compartir")}>Compartir</button></li>
          <li><button onClick={() => setVistaActual("Mi repositorio")}>Mi repositorio</button></li>
          <li><button onClick={() => setVistaActual("Acerca de")}>Acerca de</button></li>
        </ul>
      </nav>

      <div className="contenido" style={{ paddingTop: '120px' }}>
        {renderContenido()}
      </div>
    </>
  );
};

export default Navbar;
