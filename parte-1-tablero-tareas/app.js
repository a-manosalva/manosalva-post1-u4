// Estado central de la aplicación
let tareas = [];
let filtroEstado = "todas";
let filtroPrioridad = "todas";

function crearGeneradorId() {
  let contador = 1;
  return () => contador++;
}

const generarId = crearGeneradorId();

// Secuencia de estados posibles, en el orden en que una tarea avanza
const SECUENCIA_ESTADOS = ["pendiente", "en-progreso", "completada"];

// Obtiene el valor de un campo de texto y lo limpia
const leerCampo = (selector) => {
  const campo = document.querySelector(selector);
  const valor = campo.value.trim();
  campo.value = "";
  return valor;
};

// Referencia al contenedor del tablero
const tablero = document.querySelector("#tablero");

// Checkpoint de comprensión: se deja como comentario la razón de usar switch
// en vez de if/else-if — todas las ramas comparan la MISMA variable
// (prioridad) contra valores discretos conocidos, sin rangos ni condiciones
// compuestas, que es exactamente el caso de uso recomendado para switch.
function obtenerConfigPrioridad(prioridad) {
  switch (prioridad) {
    case "alta":
      return { clase: "prioridad-alta", etiqueta: "Alta" };
    case "media":
      return { clase: "prioridad-media", etiqueta: "Media" };
    case "baja":
      return { clase: "prioridad-baja", etiqueta: "Baja" };
    default:
      return { clase: "prioridad-media", etiqueta: "Media" };
  }
}

function crearElementoTarea({ id, titulo, descripcion, prioridad, estado }) {
  const { clase: clasePrioridad, etiqueta: etiquetaPrioridad } =
    obtenerConfigPrioridad(prioridad);

  const tarea = document.createElement("article");
  tarea.classList.add("tarea", `estado-${estado}`, clasePrioridad);
  tarea.dataset.id = id;

  const puedeAvanzar = estado !== "completada";

  tarea.innerHTML = `
    <span class="badge-prioridad">${etiquetaPrioridad}</span>
    <span class="badge-estado">${estado}</span>
    <h3>${titulo}</h3>
    <p>${descripcion}</p>
    <div class="acciones-tarea">
      ${
        puedeAvanzar
          ? `<button class="btn-avanzar" data-id="${id}" data-action="avanzar">Avanzar estado</button>`
          : ""
      }
      <button class="btn-eliminar" data-id="${id}" data-action="eliminar">Eliminar</button>
    </div>
  `;

  return tarea;
}

function renderizarTablero() {
  tablero.replaceChildren();

  const tareasVisibles = tareas.filter((tarea) => {
    const coincideEstado =
      filtroEstado === "todas" || tarea.estado === filtroEstado;
    const coincidePrioridad =
      filtroPrioridad === "todas" || tarea.prioridad === filtroPrioridad;

    return coincideEstado && coincidePrioridad;
  });

  for (const tarea of tareasVisibles) {
    tablero.appendChild(crearElementoTarea(tarea));
  }
}

function agregarTarea() {
  const titulo      = leerCampo("#input-titulo");
  const descripcion = leerCampo("#input-descripcion");
  const prioridad    = document.querySelector("#select-prioridad").value;

  // Validación básica: título y descripción son obligatorios
  if (!titulo || !descripcion) {
    alert("El título y la descripción son obligatorios.");
    return;
  }

  // Crear objeto tarea y agregarlo al estado
  const nuevaTarea = { id: generarId(), titulo, descripcion, prioridad, estado: "pendiente" };
  tareas.push(nuevaTarea);

  renderizarTablero();
  actualizarStats();
}

// Registrar el evento del botón
document.querySelector("#btn-agregar").addEventListener("click", agregarTarea);

document.querySelectorAll(".btn-filtro-estado").forEach((boton) => {
  boton.addEventListener("click", () => {
    filtroEstado = boton.dataset.estado;
    renderizarTablero();
  });
});

document
  .querySelector("#select-filtro-prioridad")
  .addEventListener("change", (evento) => {
    filtroPrioridad = evento.target.value;
    renderizarTablero();
  });

function actualizarStats() {
  // reduce: construye un objeto { estado: cantidad } a partir del array de tareas
  const conteos = tareas.reduce((acumulador, tarea) => {
    acumulador[tarea.estado] = (acumulador[tarea.estado] || 0) + 1;
    return acumulador;
  }, {});

  // for...of: recorre SECUENCIA_ESTADOS para mantener siempre el mismo orden
  const partes = [];
  for (const estado of SECUENCIA_ESTADOS) {
    const cantidad = conteos[estado] || 0;
    partes.push(`${cantidad} ${estado}`);
  }

  document.querySelector("#stats").textContent =
    `Tareas: ${partes.join(" · ")} (total ${tareas.length})`;
}

// Estado inicial del resumen (tablero vacío)
actualizarStats();

// Delegación: un solo listener en el tablero para ambas acciones (avanzar y eliminar)
tablero.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-action]");
  if (!boton) return;

  const id = Number(boton.dataset.id);

  if (boton.dataset.action === "eliminar") {
    tareas = tareas.filter(t => t.id !== id);
    renderizarTablero();
    actualizarStats();
    return;
  }

  if (boton.dataset.action === "avanzar") {
    const tarea = tareas.find(t => t.id === id);
    const indiceActual = SECUENCIA_ESTADOS.indexOf(tarea.estado);
    tarea.estado = SECUENCIA_ESTADOS[indiceActual + 1];

    renderizarTablero();
    actualizarStats();
  }
});

const btnsFiltroEstado = document.querySelectorAll(".btn-filtro-estado");

btnsFiltroEstado.forEach(btn => {
  btn.addEventListener("click", () => {
    btnsFiltroEstado.forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    filtroEstado = btn.dataset.estado;
    aplicarFiltros();
  });
});

document.querySelector("#select-filtro-prioridad").addEventListener("change", (e) => {
  filtroPrioridad = e.target.value;
  aplicarFiltros();
});

function aplicarFiltros() {
  // Si se implementó la Estrategia B del Paso 7, esta función puede
  // reducirse a: renderizarTablero();
  const todasLasTareas = tablero.querySelectorAll(".tarea");

  todasLasTareas.forEach(elementoTarea => {
    const id = Number(elementoTarea.dataset.id);
    const tarea = tareas.find(t => t.id === id);

    const coincideEstado    = filtroEstado === "todas" || tarea.estado === filtroEstado;
    const coincidePrioridad = filtroPrioridad === "todas" || tarea.prioridad === filtroPrioridad;

    elementoTarea.classList.toggle("oculta", !(coincideEstado && coincidePrioridad));
  });
}