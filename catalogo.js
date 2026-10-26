// catalogo.js — consume productos.json de forma asincrónica y dibuja el catálogo

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

let productos = [];
let filtroPublico = 'todos';

async function cargarProductos() {
  const grid = document.getElementById('catalogo-grid');
  try {
    const respuesta = await fetch('productos.json');
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    productos = await respuesta.json();
    renderCatalogo(productosFiltrados());
    if (typeof renderCarrito === 'function') renderCarrito();
  } catch (error) {
    console.error('Error al cargar productos.json:', error);
    grid.innerHTML = '<p class="error-carga">No pudimos cargar el catálogo. Si abriste el archivo con doble clic, abrilo con un servidor local (por ejemplo, la extensión Live Server de VS Code).</p>';
  }
}

// "Todos" muestra todo. "Para ella"/"Para él" suman las piezas unisex: nadie queda afuera de nada.
function productosFiltrados() {
  if (filtroPublico === 'todos') return productos;
  return productos.filter(p => p.publico === filtroPublico || p.publico === 'todos');
}

function renderCatalogo(lista) {
  const grid = document.getElementById('catalogo-grid');
  grid.innerHTML = lista.map(p => `
    <article class="card">
      <div class="foto-wrap">
        <img class="foto" src="${p.imagen}" alt="${p.nombre}" loading="lazy"
             onerror="this.parentElement.classList.add('sin-foto')">
      </div>
      <p class="tag">${p.categoria}</p>
      <h3>${p.nombre}</h3>
      <p class="desc">${p.descripcion}</p>
      <div class="price-row">
        <span class="price">${formatoPesos.format(p.precio)}</span>
      </div>
      <div class="comprar-row">
        <div class="cant" role="group" aria-label="Unidades de ${p.nombre}">
          <button type="button" data-sel="menos" aria-label="Una unidad menos">−</button>
          <span class="sel-valor" aria-live="polite">1</span>
          <button type="button" data-sel="mas" aria-label="Una unidad más">+</button>
        </div>
        <button class="add" data-id="${p.id}">Agregar</button>
        <button class="comprar" data-id="${p.id}">Comprar</button>
      </div>
    </article>
  `).join('');
}

document.getElementById('filtros-publico').addEventListener('click', e => {
  const boton = e.target.closest('.filtro');
  if (!boton) return;
  filtroPublico = boton.dataset.publico;
  document.querySelectorAll('.filtro').forEach(b => b.classList.toggle('activo', b === boton));
  renderCatalogo(productosFiltrados());
});

cargarProductos();
