
const grid = document.getElementById('catalogo-grid');
const formatoPrecio = new Intl.NumberFormat('es-AR');

function tarjeta(p) {
  return `
    <div class="card">
      <img class="foto" src="${p.imagen_ia_url}" alt="${p.nombre}" loading="lazy"
           onerror="this.style.display='none'">
      <p class="tag">${p.categoria}</p>
      <h3>${p.nombre}</h3>
      <p class="desc">${p.descripcion}</p>
      <div class="price-row">
        <span class="price">$${formatoPrecio.format(p.precio_simulado)}</span>
        <button class="add" data-id="${p.id}">Agregar</button>
      </div>
    </div>`;
}

fetch('productos.json')
  .then(respuesta => {
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    return respuesta.json();
  })
  .then(productos => {
    grid.innerHTML = productos.map(tarjeta).join('');
  })
  .catch(() => {
    grid.innerHTML = '<p class="desc" style="padding:30px">No pudimos cargar el catálogo. Probá recargar la página.</p>';
  });