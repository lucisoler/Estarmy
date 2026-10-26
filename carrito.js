// carrito.js — carrito de compras, checkout con validación, términos y arrepentimiento

const CLAVE_CARRITO = 'estarmy_carrito';
const CLAVE_PEDIDOS = 'estarmy_pedidos';
const CLAVE_PENDIENTE = 'estarmy_pendiente';
const MAX_POR_PRODUCTO = 10;

let carrito = leerStorage(CLAVE_CARRITO, []);

function leerStorage(clave, porDefecto) {
  try { return JSON.parse(localStorage.getItem(clave)) || porDefecto; }
  catch { return porDefecto; }
}
function escribirStorage(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}
const $ = id => document.getElementById(id);

/* ---------- Lógica del carrito ---------- */
function lineas() {
  return carrito
    .map(it => ({ ...it, producto: productos.find(p => p.id === it.id) }))
    .filter(l => l.producto);
}
function totalCarrito() {
  return lineas().reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0);
}
function agregar(id, cantidad = 1) {
  const item = carrito.find(it => it.id === id);
  if (item) item.cantidad = Math.min(item.cantidad + cantidad, MAX_POR_PRODUCTO);
  else carrito.push({ id, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) });
  guardarYRender();
}
function cambiarCantidad(id, delta) {
  const item = carrito.find(it => it.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) return quitar(id);
  item.cantidad = Math.min(item.cantidad, MAX_POR_PRODUCTO);
  guardarYRender();
}
function quitar(id) {
  carrito = carrito.filter(it => it.id !== id);
  guardarYRender();
}
function vaciar() {
  carrito = [];
  guardarYRender();
}
function guardarYRender() {
  escribirStorage(CLAVE_CARRITO, carrito);
  renderCarrito();
}

function renderCarrito() {
  const ls = lineas();
  $('contador').textContent = ls.reduce((n, l) => n + l.cantidad, 0);
  $('total').textContent = formatoPesos.format(totalCarrito());
  $('items').innerHTML = ls.length
    ? ls.map(l => `
      <li class="item">
        <h3>${l.producto.nombre}</h3>
        <span class="precio-linea">${formatoPesos.format(l.producto.precio * l.cantidad)}</span>
        <div class="cant">
          <button data-accion="menos" data-id="${l.id}" aria-label="Quitar una unidad de ${l.producto.nombre}">−</button>
          <span>${l.cantidad}</span>
          <button data-accion="mas" data-id="${l.id}" aria-label="Agregar una unidad de ${l.producto.nombre}">+</button>
        </div>
        <button class="quitar" data-accion="quitar" data-id="${l.id}">Quitar</button>
      </li>`).join('')
    : '<li class="vacio">Tu carrito está vacío.</li>';
  $('ir-checkout').disabled = ls.length === 0;
  $('vaciar').hidden = ls.length === 0;
}

/* ---------- Panel lateral ---------- */
function abrirCarrito() {
  $('carrito').classList.add('abierto');
  $('velo').classList.add('abierto');
  $('carrito').setAttribute('aria-hidden', 'false');
}
function cerrarCarrito() {
  $('carrito').classList.remove('abierto');
  $('velo').classList.remove('abierto');
  $('carrito').setAttribute('aria-hidden', 'true');
}

/* ---------- Validación ---------- */
const entregaElegida = () => document.querySelector('input[name="entrega"]:checked').value;

const reglas = {
  nombre: v => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]{5,60}$/.test(v) && /\S+\s+\S+/.test(v)
    ? '' : 'Ingresá nombre y apellido (solo letras).',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    ? '' : 'Ingresá un email válido, por ejemplo nombre@correo.com.',
  telefono: v => /^\+?\d{8,13}$/.test(v.replace(/[\s-]/g, ''))
    ? '' : 'Ingresá solo números, entre 8 y 13 dígitos.',
  localidad: v => v ? '' : 'Elegí tu localidad.',
  direccion: v => entregaElegida() === 'retiro' || v.length >= 5
    ? '' : 'Ingresá calle y número para el envío.',
  tyc: aceptado => aceptado ? '' : 'Tenés que aceptar los Términos y Condiciones.',
  pedido: v => /^EST-[A-Z0-9]{4,8}$/.test(v.toUpperCase())
    ? '' : 'Ingresá tu número de pedido, por ejemplo EST-A1B2C3.',
  emailArr: v => reglas.email(v)
};

function validarCampo(nombre) {
  const el = $(nombre);
  const valor = el.type === 'checkbox' ? el.checked : el.value.trim();
  const clave = nombre === 'email-arr' ? 'emailArr' : nombre === 'pedido-arr' ? 'pedido' : nombre;
  const mensaje = reglas[clave](valor);
  const caja = el.closest('.campo');
  caja.classList.toggle('invalido', Boolean(mensaje));
  caja.querySelector('.error').textContent = mensaje;
  el.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return !mensaje;
}

function validarFormulario(campos) {
  const resultados = campos.map(c => [c, validarCampo(c)]);
  const primerError = resultados.find(([, ok]) => !ok);
  if (primerError) $(primerError[0]).focus();
  return !primerError;
}

/* ---------- Checkout ---------- */
const CAMPOS_CHECKOUT = ['nombre', 'email', 'telefono', 'localidad', 'direccion', 'tyc'];

// compraDirecta: cuando se aprieta "Comprar" se paga solo ese producto, sin tocar el carrito
let compraDirecta = null;

function itemsCheckout() {
  if (compraDirecta) {
    const producto = productos.find(p => p.id === compraDirecta.id);
    return producto ? [{ ...compraDirecta, producto }] : [];
  }
  return lineas();
}
const sumaItems = ls => ls.reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0);

function comprarAhora(id, cantidad) {
  compraDirecta = { id, cantidad };
  abrirCheckout();
}

function abrirCheckout() {
  const ls = itemsCheckout();
  if (!ls.length) return;
  $('resumen-checkout').innerHTML = ls
    .map(l => `<li><span>${l.cantidad} × ${l.producto.nombre}</span><span>${formatoPesos.format(l.producto.precio * l.cantidad)}</span></li>`)
    .join('') + `<li class="resumen-total"><span>Total</span><span>${formatoPesos.format(sumaItems(ls))}</span></li>`;
  cerrarCarrito();
  $('dlg-checkout').showModal();
}

// Valida los datos de entrega, los deja pendientes y sigue a la página de pago
function continuarAlPago(evento) {
  evento.preventDefault();
  const ls = itemsCheckout();
  if (!ls.length) return;
  if (!validarFormulario(CAMPOS_CHECKOUT)) return;

  const pendiente = {
    origen: compraDirecta ? 'directa' : 'carrito',
    total: sumaItems(ls),
    entrega: entregaElegida(),
    nombre: $('nombre').value.trim(),
    localidad: $('localidad').value,
    items: ls.map(l => ({ nombre: l.producto.nombre, cantidad: l.cantidad, precio: l.producto.precio }))
  };
  try { sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(pendiente)); } catch { /* sin almacenamiento */ }

  $('form-checkout').reset();
  actualizarDireccion();
  window.location.href = 'pago.html';
}

function actualizarDireccion() {
  const retiro = entregaElegida() === 'retiro';
  $('campo-direccion').hidden = retiro;
  if (retiro) {
    $('direccion').value = '';
    validarCampo('direccion');
  }
}

/* ---------- Arrepentimiento ---------- */
function enviarArrepentimiento(evento) {
  evento.preventDefault();
  if (!validarFormulario(['pedido-arr', 'email-arr'])) return;
  $('paso-arr-form').hidden = true;
  $('paso-arr-ok').hidden = false;
}
function abrirArrepentimiento() {
  $('paso-arr-form').hidden = false;
  $('paso-arr-ok').hidden = true;
  $('form-arr').reset();
  $('dlg-arrepentimiento').showModal();
}

/* ---------- Eventos ---------- */
$('catalogo-grid').addEventListener('click', e => {
  const tarjeta = e.target.closest('.card');
  if (!tarjeta) return;
  const valor = tarjeta.querySelector('.sel-valor');

  const selector = e.target.closest('button[data-sel]');
  if (selector) {
    const n = Number(valor.textContent) + (selector.dataset.sel === 'mas' ? 1 : -1);
    valor.textContent = Math.min(MAX_POR_PRODUCTO, Math.max(1, n));
    return;
  }

  const cantidad = Number(valor.textContent);
  const botonAgregar = e.target.closest('.add');
  if (botonAgregar) {
    agregar(Number(botonAgregar.dataset.id), cantidad);
    valor.textContent = 1;
    botonAgregar.textContent = 'Agregado';
    setTimeout(() => { botonAgregar.textContent = 'Agregar'; }, 900);
    return;
  }

  const botonComprar = e.target.closest('.comprar');
  if (botonComprar) comprarAhora(Number(botonComprar.dataset.id), cantidad);
});

$('items').addEventListener('click', e => {
  const b = e.target.closest('button[data-accion]');
  if (!b) return;
  const id = Number(b.dataset.id);
  if (b.dataset.accion === 'mas') cambiarCantidad(id, 1);
  if (b.dataset.accion === 'menos') cambiarCantidad(id, -1);
  if (b.dataset.accion === 'quitar') quitar(id);
});

$('abrir-carrito').addEventListener('click', abrirCarrito);
$('cerrar-carrito').addEventListener('click', cerrarCarrito);
$('velo').addEventListener('click', cerrarCarrito);
$('vaciar').addEventListener('click', vaciar);
$('ir-checkout').addEventListener('click', () => { compraDirecta = null; abrirCheckout(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCarrito(); });

$('form-checkout').addEventListener('submit', continuarAlPago);
$('dlg-checkout').addEventListener('close', () => { compraDirecta = null; });
CAMPOS_CHECKOUT.forEach(c => $(c).addEventListener('blur', () => validarCampo(c)));
document.querySelectorAll('input[name="entrega"]').forEach(r => r.addEventListener('change', actualizarDireccion));

$('form-arr').addEventListener('submit', enviarArrepentimiento);
['pedido-arr', 'email-arr'].forEach(c => $(c).addEventListener('blur', () => validarCampo(c)));

$('abrir-tyc').addEventListener('click', e => { e.preventDefault(); $('dlg-tyc').showModal(); });
$('abrir-tyc-2').addEventListener('click', e => { e.preventDefault(); $('dlg-tyc').showModal(); });
$('abrir-arrep').addEventListener('click', e => { e.preventDefault(); abrirArrepentimiento(); });

document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => d.close()));
});

renderCarrito();

if (location.hash === '#arrepentimiento') abrirArrepentimiento();
