import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getCookie, deleteCookie } from './Cookies';
import { useTable } from 'react-table';
/* import AdminPanel from './Admin/AdminPanel';
import AdminRoute from './Admin/AdminRoute'; */
import Axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './style/SweetAlert.css';
import './style/Navbar.css';
import './style/Menu.css';

const Navbar = () => {
  const [vistaActual, setVistaActual] = useState("bienvenida");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [descripcionPerfil, setDescripcionPerfil] = useState("");
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [nombrePerfil, setNombrePerfil] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const idUsuario = getCookie('userId');
  const rol = getCookie('rol');
  const [idRepositorio, setIdRepositorio] = useState(null);
  const [archivos, setArchivos] = useState([]); // Archivos en la carpeta actual
  const [carpetaActual] = useState(null); // ID de la carpeta actual
  const [previewUrl, setPreviewUrl] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [accionMenuAbierto, setAccionMenuAbierto] = useState(null); // Panel de admin
  const previewRef = useRef(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const userId = getCookie('userId');
    if (!userId) {
      navigate('/login');
    }
  }, [navigate]);

  const cargarUsuarios = useCallback(() => {
    Axios.get('http://localhost:3001/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(() => setUsuarios([]));
  }, []);

  const handleCerrarSesion = () => {
    deleteCookie('userId');
    Swal.fire({
      icon: 'success',
      title: '¡Sesión cerrada!',
      text: 'Redirigiendo al inicio de sesión...',
      scrollbarPadding: false,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: '#111',
      color: '#00ff00',
    }).then(() => {
      navigate('/login');
    });
  };
  // Carga los archivos del repositorio del usuario
  const handleVisualizar = (archivo) => {
    const esImagen = archivo.Tipo && archivo.Tipo.startsWith('image');
    const esVideo = archivo.Tipo && archivo.Tipo.startsWith('video');
    if (esImagen) {
      setPreviewUrl({ tipo: 'imagen', url: `http://localhost:3001/uploads/${archivo.Ruta}` });
    } else if (esVideo) {
      setPreviewUrl({ tipo: 'video', url: `http://localhost:3001/uploads/${archivo.Ruta}` });
    } else {
      setPreviewUrl(null);
      setUploadMessage('Solo se pueden previsualizar imágenes o videos.');
    }
  };

  const handleEliminar = async (idArchivo, ruta) => {
    const result = await Swal.fire({
      title: '¿Seguro que deseas eliminar este archivo?',
      text: '¡No podrás recuperarlo!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00e200',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#111',
      color: '#00ff00',
      scrollbarPadding: false,
      customClass: {
        confirmButton: 'swal2-confirm-wide',
        cancelButton: 'swal2-cancel-wide'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await Axios.delete(`http://localhost:3001/archivo/${idArchivo}`, { data: { ruta } });
      Swal.fire({
        icon: 'success',
        title: 'Archivo eliminado',
        confirmButtonColor: '#00e200',
        background: '#111',
        color: '#00ff00',
        scrollbarPadding: false,
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
      cargarArchivos(idRepositorio);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar archivo',
        confirmButtonColor: '#00e200',
        background: '#111',
        color: '#00ff00',
        scrollbarPadding: false,
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
    }
  };

  // filtrar usuarios en el react table de admin
  const filteredUsuarios = useMemo(() => {
    if (!search) return usuarios;
    return usuarios.filter(u =>
      u.Nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.Correo.toLowerCase().includes(search.toLowerCase()) ||
      (u.Rol && u.Rol.toLowerCase().includes(search.toLowerCase()))
    );
  }, [usuarios, search]);

  // Maneja el cambio de foto de perfil
  // Lee el archivo seleccionado y lo convierte a una URL de datos
  const handleFotoPerfilChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPerfil(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarDescripcion = () => {
    setEditandoDescripcion(false);
    Axios.post(`http://localhost:3001/perfil/${idUsuario}`, {
      FotoPerfil: fotoPerfil,
      Descripcion: descripcionPerfil,
      Nombre: nombrePerfil
    }).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Descripción guardada',
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
      // Si estás en Compartir, recarga la lista de usuarios
      if (vistaActual === "Usuarios") {
        cargarUsuarios();
      }
    });
  };

  // Obtiene el ID del repositorio del usuario destino y carga los archivos enviados a su repo
  useEffect(() => {
    if (idUsuario) {
      Axios.get(`http://localhost:3001/repositorio-usuario/${idUsuario}`)
        .then(res => {
          if (res.data && res.data.ID_Repositorio) {
            setIdRepositorio(res.data.ID_Repositorio);
          }
        });
    }
  }, [idUsuario]);
  // Carga los archivos del repositorio del usuario destino
  const cargarArchivos = async (idRepo) => {
    const idUsuario = getCookie('userId');
    if (!idRepo) return;
    const res = await Axios.get(`http://localhost:3001/archivos/${idRepo}?user=${idUsuario}`);
    console.log('Archivos para compartir:', res.data);
    setArchivos(res.data);
  };

  // Carga la foto de perfil y la descripción del usuario al cargar la vista de perfil
  useEffect(() => {
    if (vistaActual === "Mi perfil" && idUsuario) {
      Axios.get(`http://localhost:3001/perfil/${idUsuario}`)
        .then(res => {
          setFotoPerfil(res.data.FotoPerfil || null);
          setDescripcionPerfil(res.data.Descripcion || "");
          setNombrePerfil(res.data.Nombre || "");
        });
    }
  }, [vistaActual, idUsuario]);

  // Muestra los usuarios en la vista de compartir tambien carga los archivos a compartir
  useEffect(() => {
    if (vistaActual === "Usuarios" && idRepositorio) {
      cargarUsuarios();
      cargarArchivos(idRepositorio);
    }
  }, [vistaActual, idRepositorio, cargarUsuarios]);

  // Al iniciar sesion si vamos directamente a panel este carga al momento
  useEffect(() => {
    if (vistaActual === "admin") {
      cargarUsuarios();
    }
  }, [vistaActual, cargarUsuarios]);

  // si se cambia de vista se cierra el menu de acciones
  useEffect(() => {
    setAccionMenuAbierto(null);
  }, [vistaActual]);

  useEffect(() => {
    if (!idUsuario) return;
    const timeout = setTimeout(() => {
      Axios.get(`http://localhost:3001/archivos-compartidos-pendientes/${idUsuario}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            const remitente = res.data[0].NombreRemitente;
            const archivos = res.data.map(a => `<li>${a.NombreArchivo}</li>`).join('');
            Swal.fire({
              title: `¡${remitente} te ha compartido los siguientes archivos!`,
              html: `<ul style="color:#00ff00">${archivos}</ul>`,
              showCancelButton: true,
              confirmButtonText: 'Aceptar',
              cancelButtonText: 'Cancelar',
              background: '#111',
              color: '#00ff00',
              confirmButtonColor: '#00e200',
              customClass: {
                confirmButton: 'swal2-confirm-wide',
                cancelButton: 'swal2-cancel-wide'
              }
            }).then(result => {
              if (result.isConfirmed) {
                Axios.post(`http://localhost:3001/aceptar-archivos-compartidos`, {
                  idUsuario,
                  archivos: res.data.map(a => a.ID_Archivo)
                }).then(() => {
                  Swal.fire({
                    icon: 'success',
                    title: '¡Archivos agregados a tu repositorio!',
                    background: '#111',
                    color: '#00ff00',
                    confirmButtonColor: '#00e200',
                    customClass: {
                      confirmButton: 'swal2-confirm-wide'
                    }
                  });
                  if (vistaActual === "Mi repositorio") {
                    cargarArchivos(idRepositorio);
                  }
                });
              } else {
                Axios.post(`http://localhost:3001/rechazar-archivos-compartidos`, {
                  idUsuario,
                  archivos: res.data.map(a => a.ID_Archivo)
                });
              }
            });
          }
        });
    }, 6000);

    return () => clearTimeout(timeout);
  }, [idUsuario, vistaActual, idRepositorio]);

  // Muestra una noti de confirmación si el usuario acepta los archivos compartidos
  useEffect(() => {
    if (!idUsuario) return;
    const interval = setInterval(() => {
      Axios.get(`http://localhost:3001/notificaciones/${idUsuario}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            // Solo mostramos la primera notificación pendiente
            const noti = res.data[0];
            // Marcamos como leída antes de mostrar el Swal
            Axios.post(`http://localhost:3001/notificacion-leida/${noti.ID_Notificacion}`).then(() => {
              Swal.fire({
                icon: 'info',
                title: 'Notificación',
                text: noti.Mensaje,
                background: '#111',
                color: '#00ff00',
                confirmButtonColor: '#00e200',
                scrollbarPadding: false,
                customClass: {
                  confirmButton: 'swal2-confirm-wide'
                }
              });
            });
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [idUsuario]);

  useEffect(() => {
    if (previewUrl) setPreviewReady(false);
  }, [previewUrl]);

  useEffect(() => {
    if (previewReady && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [previewReady]);

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
  /* Al momento de presionar el boton de compartir archivos se muestra un modal con los archivos disponibles
  y se permite seleccionar los archivos a compartir con el usuario seleccionado */
  const mostrarSelectorArchivos = (usuarioDestino) => {
    if (!archivos || archivos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No tienes archivos para compartir',
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
      return;
    }
    Swal.fire({
      title: 'Seleccione los archivos a compartir',
      html: `
      <form id="form-archivos-compartir" class="selector-archi-form">
        <table class="selector-archi-table" style="width:100%; color:#00ff00; background:#111; border-radius:8px;">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${archivos.map(archivo => `
              <tr>
                <td><input type="checkbox" name="archivos" value="${archivo.ID_Archivo}" /></td>
                <td>${archivo.Nombre}</td>
                <td>${archivo.Tipo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </form>
    `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      background: '#111',
      color: '#00ff00',
      scrollbarPadding: false,
      confirmButtonColor: '#00e200',
      customClass: {
        popup: 'swal2-popup-wide',
        confirmButton: 'swal2-confirm-wide',
        cancelButton: 'swal2-cancel-wide'
      },
      willOpen: () => {
        // Forzar un pequeño retraso para asegurar que el DOM esté listo
        setTimeout(() => { }, 50);
      },
      preConfirm: () => {
        const form = document.getElementById('form-archivos-compartir');
        let checkboxes = form.elements['archivos'];
        if (!checkboxes) return [];
        // Si solo hay un checkbox se convierte en array
        if (!Array.isArray(checkboxes) && !(checkboxes instanceof NodeList)) {
          checkboxes = [checkboxes];
        }
        const seleccionados = Array.from(checkboxes)
          .filter(input => input.checked)
          .map(input => input.value);
        if (seleccionados.length === 0) {
          Swal.showValidationMessage('Selecciona al menos un archivo');
          return false;
        }
        return seleccionados;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        compartirArchivosConUsuario(usuarioDestino.ID_Usuario, result.value);
      }
    });
  };
  const compartirArchivosConUsuario = (idUsuarioDestino, archivosSeleccionados) => {
    Axios.post('http://localhost:3001/compartir-archivos', {
      idUsuarioRemite: idUsuario, // el usuario actual
      idUsuarioDestino,
      archivos: archivosSeleccionados
    }).then(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Archivos compartidos!',
        text: `Se compartieron ${archivosSeleccionados.length} archivos.`,
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
    }).catch(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron compartir los archivos.',
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
    });
  };

  // Muestra los archivos del usuario seleccionado en un popup para el panel de administración
  const handleVerArchivosUsuario = async (usuario) => {
    try {
      // 1. Obtener el repositorio del usuario
      const repoRes = await Axios.get(`http://localhost:3001/repositorio-usuario/${usuario.ID_Usuario}`);
      const idRepo = repoRes.data.ID_Repositorio;
      // 2. Obtener los archivos de ese repositorio
      const archivosRes = await Axios.get(`http://localhost:3001/archivos/${idRepo}?user=${usuario.ID_Usuario}`);
      const archivos = archivosRes.data;

      if (!archivos.length) {
        Swal.fire({
          icon: 'info',
          title: `Archivos de ${usuario.Nombre}`,
          text: 'Este usuario no tiene archivos en su repositorio.',
          background: '#111',
          color: '#00ff00',
          confirmButtonColor: '#00e200',
          scrollbarPadding: false,
          customClass: { confirmButton: 'swal2-confirm-wide' }
        });
        return;
      }

      // 3. Mostrar los archivos en un popup
      Swal.fire({
        title: `Archivos de ${usuario.Nombre}`,
        html: `
        <ul style="text-align:left; color:#00ff00; max-height:300px; overflow:auto;">
          ${archivos.map(a => `<li>${a.Nombre}</li>`).join('')}
        </ul>
      `,
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        customClass: { confirmButton: 'swal2-confirm-wide' }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron obtener los archivos del usuario.',
        background: '#111',
        color: '#00ff00',
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        customClass: { confirmButton: 'swal2-confirm-wide' }
      });
    }
  };

  // maneja acciones dentro del panel de administración
  const handleEliminarUsuario = useCallback((idUsuario) => {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00e200',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      background: '#111',
      color: '#00ff00',
      customClass: {
        confirmButton: 'swal2-confirm-wide',
        cancelButton: 'swal2-cancel-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.delete(`http://localhost:3001/usuario/${idUsuario}`)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El usuario ha sido eliminado.',
              background: '#111',
              color: '#00ff00',
              confirmButtonColor: '#00e200',
              scrollbarPadding: false,
              customClass: {
                confirmButton: 'swal2-confirm-wide'
              }
            });
            cargarUsuarios();
          });
      }
    });
  }, [cargarUsuarios]);

  const handleCambiarRol = useCallback((usuario) => {
    const nuevoRol = usuario.Rol === 'admin' ? 'usuario' : 'admin';
    Swal.fire({
      title: 'Cambiar rol',
      text: `¿Seguro que deseas cambiar el rol a "${nuevoRol}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00e200',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      background: '#111',
      color: '#00ff00',
      customClass: {
        confirmButton: 'swal2-confirm-wide',
        cancelButton: 'swal2-cancel-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.put(`http://localhost:3001/usuario/${usuario.ID_Usuario}/rol`, { rol: nuevoRol })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Rol cambiado',
              text: `El usuario ahora es "${nuevoRol}".`,
              background: '#111',
              color: '#00ff00',
              confirmButtonColor: '#00e200',
              scrollbarPadding: false,
              customClass: {
                confirmButton: 'swal2-confirm-wide'
              }
            });
            cargarUsuarios();
          });
      }
    });
  }, [cargarUsuarios]);

  const handleBanearUsuario = useCallback((idUsuario, baneadoActual) => {
    Swal.fire({
      title: baneadoActual ? '¿Desbanear usuario?' : '¿Banear usuario?',
      text: baneadoActual
        ? 'El usuario podrá volver a acceder al sistema.'
        : 'El usuario no podrá acceder al sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00e200',
      cancelButtonColor: '#d33',
      confirmButtonText: baneadoActual ? 'Sí, desbanear' : 'Sí, banear',
      background: '#111',
      color: '#00ff00',
      customClass: {
        confirmButton: 'swal2-confirm-wide',
        cancelButton: 'swal2-cancel-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Axios.put(`http://localhost:3001/usuario/${idUsuario}/ban`, { baneado: !baneadoActual })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: baneadoActual ? 'Desbaneado' : 'Baneado',
              text: baneadoActual
                ? 'El usuario ha sido desbaneado.'
                : 'El usuario ha sido baneado.',
              background: '#111',
              color: '#00ff00',
              confirmButtonColor: '#00e200',
              scrollbarPadding: false,
              customClass: {
                confirmButton: 'swal2-confirm-wide'
              }
            });
            cargarUsuarios();
          });
      }
    });
  }, [cargarUsuarios]);

  useEffect(() => {
    if (!idUsuario) return;
    Axios.get(`http://localhost:3001/perfil/${idUsuario}`)
      .then(res => {
        if (res.data.Baneado) {
          deleteCookie('userId');
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Fuiste baneado por uso indebido de la web.',
            background: '#111',
            color: '#00ff00',
            confirmButtonColor: '#00e200',
            customClass: {
              confirmButton: 'swal2-confirm-wide'
            }
          }).then(() => {
            navigate('/login');
          });
        }
      });
  }, [idUsuario, navigate]);
  // Tabla de administración de usuarios crea columnas y datos para react-table
  const columns = useMemo(() => [
    { Header: 'Nombre', accessor: 'Nombre' },
    { Header: 'Correo', accessor: 'Correo' },
    { Header: 'Rol', accessor: 'Rol' },
    {
      Header: 'Acciones',
      id: 'acciones',
      Cell: ({ row }) => (
        <div style={{ position: 'relative' }}>
          <button
            className="acciones-btn"
            onClick={() =>
              setAccionMenuAbierto(accionMenuAbierto === row.original.ID_Usuario ? null : row.original.ID_Usuario)
            }
          >
            Acciones
          </button>
          {accionMenuAbierto === row.original.ID_Usuario && (
            <div className="acciones-dropdown-panel">
              <button onClick={() => handleEliminarUsuario(row.original.ID_Usuario)}>Eliminar usuario</button>
              <button onClick={() => handleCambiarRol(row.original)}>Cambiar rol</button>
              <button onClick={() => handleBanearUsuario(row.original.ID_Usuario, row.original.Baneado)}>
                {row.original.Baneado ? 'Desbanear' : 'Banear'}
              </button>
              <button onClick={() => handleVerArchivosUsuario(row.original)}>Ver archivos</button> {/* <-- AGREGA ESTA LÍNEA */}
            </div>
          )}
        </div>
      ),
    },
  ], [accionMenuAbierto, handleEliminarUsuario, handleCambiarRol, handleBanearUsuario]);

  const tableInstance = useTable({ columns, data: filteredUsuarios });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

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
                type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip,.mp4"
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
      // si hay usuarios registrados, los muestra si no muestra un mensaje
      // .map para recorrer el array de usuarios y mostrar su nombre
      // .length para saber cuantos elementos hay en el array
      case "Usuarios":
        return (
          <div className='conteiner-usuarios'>
            <h2>Usuarios registrados</h2>
            <p className='subtitulo-compartir'>Busca y comparte archivos con los usuarios</p>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={e => setBusquedaUsuario(e.target.value)}
              className="busqueda-usuarios"
            />
            {usuarios.filter(usuario =>
              usuario.Nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())
            ).length === 0 && (
                <p style={{ color: '#00ff00', marginTop: '20px' }}>No se encontraron usuarios.</p>
              )}
            <div className="usuarios-lista">
              {usuarios
                .filter(usuario =>
                  usuario.ID_Usuario !== Number(idUsuario) &&
                  usuario.Nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())
                )
                .map(usuario => (
                  <div
                    key={usuario.ID_Usuario}
                    className='usuario-card'
                    onClick={() => {
                      Swal.fire({
                        title: usuario.Nombre,
                        html: `
                          <div class="usuario-foto-circulo grande">
                            <img src="${usuario.FotoPerfil || process.env.PUBLIC_URL + "/default-user.png"}"
                                  alt="Foto de usuario"
                                  class="usuario-foto-img" />
                         </div>
                         <div style="color:#00ff88; margin-top:8px; font-size:1rem;">
                           ${usuario.Descripcion ? usuario.Descripcion : 'Sin descripción.'}
                         </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Compartir',
                        cancelButtonText: 'Cerrar',
                        background: '#111',
                        color: '#00ff00',
                        scrollbarPadding: false,
                        customClass: {
                          confirmButton: 'swal2-confirm-wide',
                          cancelButton: 'swal2-cancel-wide'
                        }
                      }).then(result => {
                        if (result.isConfirmed) {
                          mostrarSelectorArchivos(usuario);
                        }
                        // Si se presiona "Cerrar" (cancel), no hace nada y solo cierra el modal
                      });
                    }}
                  >
                    <div className="usuario-foto-circulo">
                      <img
                        src={usuario.FotoPerfil || process.env.PUBLIC_URL + "/default-user.png"}
                        alt="Foto de usuario"
                        className="usuario-foto-img"
                      />
                    </div>
                    <span style={{ marginTop: '10px' }}>{usuario.Nombre}</span>
                  </div>
                ))
              }
            </div>
          </div>
        );
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
                      <td style={{ position: 'relative' }}>
                        <button
                          className="acciones-btn"
                          onClick={() => setMenuAbierto(menuAbierto === archivo.ID_Archivo ? null : archivo.ID_Archivo)}
                        >
                          Acciones
                        </button>
                        {menuAbierto === archivo.ID_Archivo && (
                          <div className="acciones-dropdown">
                            {(archivo.Tipo && (archivo.Tipo.startsWith('image') || archivo.Tipo.startsWith('video'))) && (
                              <button onClick={() => { handleVisualizar(archivo); setMenuAbierto(null); }}>Visualizar</button>
                            )}
                            <button onClick={() => { handleEliminar(archivo.ID_Archivo, archivo.Ruta); setMenuAbierto(null); }}>Eliminar</button>
                            <button onClick={() => { window.open(`http://localhost:3001/download/${archivo.Ruta}`, '_blank'); setMenuAbierto(null); }}>Descargar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {previewUrl && (
              <div style={{ marginTop: '0' }}>
                <h3 style={{ marginBottom: '5px' }}>Vista previa</h3>
                {previewUrl.tipo === 'imagen' && (
                  <img
                    src={previewUrl.url}
                    alt="Vista previa"
                    style={{ maxWidth: '400px', maxHeight: '300px' }}
                    onLoad={() => setPreviewReady(true)}
                  />
                )}
                {previewUrl.tipo === 'video' && (
                  <video
                    src={previewUrl.url}
                    controls
                    style={{ maxWidth: '400px', maxHeight: '300px' }}
                    onLoadedData={() => setPreviewReady(true)}
                  />
                )}
                <br />
                <button
                  ref={previewRef}
                  className='cerrar-vista-previa'
                  onClick={() => setPreviewUrl(null)}
                >
                  Cerrar vista previa
                </button>
              </div>
            )}
          </div>
        );
      case "Mi perfil":
        return (
          <div className='Desing-conteiner perfil-container'>
            <div className="perfil-nombre-section" style={{ marginBottom: 16 }}>
              <input
                className="perfil-nombre-input"
                type="text"
                placeholder='Modifica tu nombre'
                value={nombrePerfil}
                onChange={e => setNombrePerfil(e.target.value)}
                disabled={!editandoDescripcion}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  background: editandoDescripcion ? '#222' : '#111',
                  color: '#00ff00',
                  border: '1px solid #00ff00',
                  borderRadius: 8,
                  marginBottom: 8,
                  width: 220
                }}
              />
            </div>
            <div className="perfil-foto-section">
              <div className="perfil-foto-circulo">
                <img
                  src={fotoPerfil || process.env.PUBLIC_URL + "/default-user.png"}
                  alt="Foto de perfil"
                  className="perfil-foto-img"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                id="input-foto-perfil"
                style={{ display: "none" }}
                onChange={handleFotoPerfilChange}
              />
              <button
                className="acciones-btn"
                style={{ marginTop: '15px', width: '150px' }}
                onClick={() => document.getElementById('input-foto-perfil').click()}
              >
                Editar foto
              </button>
            </div>
            <div className="perfil-descripcion-section">
              <textarea
                className="perfil-descripcion"
                placeholder="Escribe algo sobre ti..."
                value={descripcionPerfil}
                onChange={e => setDescripcionPerfil(e.target.value)}
                disabled={!editandoDescripcion}
              />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
              {!editandoDescripcion ? (
                <button
                  className="acciones-btn"
                  onClick={() => setEditandoDescripcion(true)}
                >
                  Editar descripción
                </button>
              ) : (
                <button
                  className="acciones-btn"
                  onClick={handleGuardarDescripcion}
                >
                  Guardar descripción
                </button>
              )}
            </div>
            <button
              className="acciones-btn"
              style={{ marginTop: '30px', width: '200px' }}
              onClick={handleCerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        );
      case "admin":
        return (
          <div className="Desing-conteiner">
            <h2>Panel de administración</h2>
            <p style={{ color: "#00ff00" }}>
              ¡Bienvenido, administrador! Aquí puedes gestionar usuarios.
            </p>
            <input
              type="text"
              placeholder="Buscar usuario por nombre, correo o rol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                marginBottom: '16px',
                padding: '8px',
                width: '100%',
                background: '#222',
                color: '#00ff00',
                border: '1px solid #00ff00',
                borderRadius: '8px'
              }}
            />
            <div style={{ overflowX: 'auto', marginTop: 30 }}>
              <table {...getTableProps()} className="admin-table">
                <thead>
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps()} key={column.id}>{column.render('Header')}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {rows.map(row => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} key={row.id}>
                        {row.cells.map(cell => (
                          <td {...cell.getCellProps()} key={cell.column.id}>{cell.render('Cell')}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <nav className="navbar">
        <ul className="navbar-links">
          <li><button onClick={() => setVistaActual("bienvenida")}>Bienvenida</button></li>
          <li><button onClick={() => setVistaActual("subir")}>Subir</button></li>
          <li><button onClick={() => setVistaActual("Usuarios")}>Usuarios</button></li>
          <li><button onClick={() => setVistaActual("Mi repositorio")}>Mi repositorio</button></li>
          <li><button onClick={() => setVistaActual("Mi perfil")}>Mi perfil</button></li>
          {rol === 'admin' && (
            <li>
              <button
                className="navbar-btn"
                onClick={() => setVistaActual("admin")}
              >
                Panel de administración
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="contenido" style={{ paddingTop: '120px' }}>
        {renderContenido()}
      </div>
    </>
  );
};

export default Navbar;