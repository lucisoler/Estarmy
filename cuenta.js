// cuenta.js — registro e inicio de sesión simulados, 100% client-side (sin backend real)
// Los botones de Google/Facebook no se conectan a ninguna API real: simulan el flujo
// para la evaluación académica, igual que el resto de la compra en pago.html.

const CLAVE_USUARIOS = 'estarmy_usuarios';
const CLAVE_SESION = 'estarmy_sesion';

const leerUsuarios = () => leerStorage(CLAVE_USUARIOS, []);
const guardarUsuarios = lista => escribirStorage(CLAVE_USUARIOS, lista);
const leerSesion = () => leerStorage(CLAVE_SESION, null);
const guardarSesion = sesion => escribirStorage(CLAVE_SESION, sesion);

const reglasCuenta = {
  'login-email': v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Ingresá un email válido.',
  'login-password': v => v.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres.',
  'registro-nombre': v => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]{5,60}$/.test(v) && /\S+\s+\S+/.test(v) ? '' : 'Ingresá nombre y apellido.',
  'registro-email': v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Ingresá un email válido.',
  'registro-password': v => v.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres.'
};

function validarCampoCuenta(id) {
  const el = $(id);
  const mensaje = reglasCuenta[id](el.value.trim());
  const caja = el.closest('.campo');
  caja.classList.toggle('invalido', Boolean(mensaje));
  caja.querySelector('.error').textContent = mensaje;
  el.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return !mensaje;
}

function mostrarErrorCuenta(id, mensaje) {
  const caja = $(id).closest('.campo');
  caja.classList.add('invalido');
  caja.querySelector('.error').textContent = mensaje;
}

function actualizarBotonCuenta() {
  const sesion = leerSesion();
  const texto = sesion ? ('Hola, ' + sesion.nombre.split(' ')[0]) : 'Ingresar';
  document.querySelectorAll('#abrir-cuenta, #abrir-cuenta-movil').forEach(b => { b.textContent = texto; });
}

function mostrarVistaCuenta() {
  const sesion = leerSesion();
  $('cuenta-invitado').hidden = Boolean(sesion);
  $('cuenta-sesion').hidden = !sesion;
  if (sesion) {
    $('sesion-nombre').textContent = sesion.nombre;
    $('sesion-email').textContent = sesion.email;
  }
}

function abrirCuenta(evento) {
  if (evento) evento.preventDefault();
  mostrarVistaCuenta();
  $('dlg-cuenta').showModal();
}

function cambiarTabCuenta(tab) {
  document.querySelectorAll('.tab-cuenta').forEach(b => {
    const activo = b.dataset.tab === tab;
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-selected', String(activo));
  });
  $('form-login').hidden = tab !== 'login';
  $('form-registro').hidden = tab !== 'registro';
}

function iniciarSesionEmail(evento) {
  evento.preventDefault();
  const ok = ['login-email', 'login-password'].map(validarCampoCuenta).every(Boolean);
  if (!ok) return;
  const email = $('login-email').value.trim().toLowerCase();
  const password = $('login-password').value;
  const usuario = leerUsuarios().find(u => u.email === email && u.password === password);
  if (!usuario) {
    mostrarErrorCuenta('login-password', 'Email o contraseña incorrectos, o todavía no creaste la cuenta.');
    return;
  }
  guardarSesion({ nombre: usuario.nombre, email: usuario.email, metodo: 'email' });
  $('form-login').reset();
  actualizarBotonCuenta();
  mostrarVistaCuenta();
}

function crearCuenta(evento) {
  evento.preventDefault();
  const ok = ['registro-nombre', 'registro-email', 'registro-password'].map(validarCampoCuenta).every(Boolean);
  if (!ok) return;
  const email = $('registro-email').value.trim().toLowerCase();
  const usuarios = leerUsuarios();
  if (usuarios.some(u => u.email === email)) {
    mostrarErrorCuenta('registro-email', 'Ya existe una cuenta con ese email. Probá iniciar sesión.');
    return;
  }
  const nuevo = { nombre: $('registro-nombre').value.trim(), email, password: $('registro-password').value };
  usuarios.push(nuevo);
  guardarUsuarios(usuarios);
  guardarSesion({ nombre: nuevo.nombre, email: nuevo.email, metodo: 'email' });
  $('form-registro').reset();
  actualizarBotonCuenta();
  mostrarVistaCuenta();
}

function loginSimulado(proveedor) {
  const boton = proveedor === 'google' ? $('login-google') : $('login-facebook');
  const nombreProveedor = proveedor === 'google' ? 'Google' : 'Facebook';
  const original = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Conectando con ' + nombreProveedor + '… (simulación)';
  setTimeout(() => {
    guardarSesion({
      nombre: 'Cuenta de ' + nombreProveedor + ' (demo)',
      email: 'demo.' + proveedor + '@estarmy.ar',
      metodo: proveedor
    });
    boton.disabled = false;
    boton.textContent = original;
    actualizarBotonCuenta();
    mostrarVistaCuenta();
  }, 900);
}

function cerrarSesionUsuario() {
  guardarSesion(null);
  actualizarBotonCuenta();
  mostrarVistaCuenta();
  cambiarTabCuenta('login');
}

document.querySelectorAll('#abrir-cuenta, #abrir-cuenta-movil').forEach(b => b.addEventListener('click', abrirCuenta));
document.querySelectorAll('.tab-cuenta').forEach(b => b.addEventListener('click', () => cambiarTabCuenta(b.dataset.tab)));
$('form-login').addEventListener('submit', iniciarSesionEmail);
$('form-registro').addEventListener('submit', crearCuenta);
$('login-google').addEventListener('click', () => loginSimulado('google'));
$('login-facebook').addEventListener('click', () => loginSimulado('facebook'));
$('cerrar-sesion').addEventListener('click', cerrarSesionUsuario);
['login-email', 'login-password'].forEach(c => $(c).addEventListener('blur', () => validarCampoCuenta(c)));
['registro-nombre', 'registro-email', 'registro-password'].forEach(c => $(c).addEventListener('blur', () => validarCampoCuenta(c)));

actualizarBotonCuenta();
