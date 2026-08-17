/* =========================================================================
   LÓGICA Y MANIPULACIÓN DEL DOM
========================================================================== */
const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const barrioSelect = document.getElementById('barrioSelect');
const barriosStrip = document.getElementById('barriosStrip');

const clasesGrid = document.getElementById('clasesGrid');
const clasesEmptyState = document.getElementById('clasesEmptyState');
const claseBarrioSelect = document.getElementById('claseBarrioSelect');

// Detección automática del día actual de la semana
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hoyIndice = new Date().getDay();
const hoyNombre = diasSemana[hoyIndice];

// Estado de Filtros para Milongas (Día actual por defecto)
let currentDay = hoyNombre;
let currentBarrio = 'todos';

// Estado de Filtros para Clases (Día actual por defecto)
let currentClaseDay = hoyNombre;
let currentClaseBarrio = 'todos';

// Barrios únicos de MILONGAS_DATA
const barriosMilongas = [...new Set(MILONGAS_DATA.map(m => m.barrio))].sort();

// Poblar select y .barrios-strip con barrios de milongas
barriosMilongas.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; 
    opt.textContent = b;
    barrioSelect.appendChild(opt);

    const chip = document.createElement('span');
    chip.className = 'barrio-chip';
    chip.textContent = b;
    chip.addEventListener('click', () => {
        filterByBarrioAndAllDays(b);
        document.getElementById('milongas').scrollIntoView({ behavior: 'smooth' });
    });
    barriosStrip.appendChild(chip);
});

// Barrios únicos de CLASES_DATA
const barriosClases = [...new Set(CLASES_DATA.map(c => c.barrio))].sort();
barriosClases.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; 
    opt.textContent = b;
    claseBarrioSelect.appendChild(opt);
});

// Filtrar por barrio específico y colocar el día en "todos" (para milongas desde barrios-strip)
function filterByBarrioAndAllDays(barrio) {
    currentBarrio = barrio;
    currentDay = 'todos';

    barrioSelect.value = barrio;

    document.querySelectorAll('#filtersBar .day-chip').forEach(b => {
        if (b.dataset.day === 'todos') {
            b.setAttribute('aria-pressed', 'true');
        } else {
            b.setAttribute('aria-pressed', 'false');
        }
    });

    applyFilters();
}

function mapEmbedUrl(direccion) {
    return `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
}
function directionsUrl(direccion) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`;
}
function mapsSearchUrl(direccion) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

function getFrecuenciaLabel(frecuencia, proximaFechaStr) {
    switch(frecuencia) {
        case 'semanal':
            return 'Todas las semanas';
        case 'quincenal':
            return 'Cada quince días';
        case 'mensual':
            return 'Todos los meses';
        case 'fecha_unica':
            if (!proximaFechaStr) return 'Fecha única';
            const [year, month, day] = proximaFechaStr.split('-');
            const date = new Date(year, month - 1, day);
            const mesNombre = date.toLocaleDateString('es-ES', { month: 'long' });
            return `Solamente ${parseInt(day, 10)} de ${mesNombre}`;
        default:
            return frecuencia || '';
    }
}

// Helper para calcular la diferencia de días a la próxima fecha
// Únicamente muestra "Fecha pasada" si la frecuencia es "fecha_unica" y diffDays < 0
function getCountdownInfo(proximaFechaStr, frecuencia) {
    if (!proximaFechaStr) return { text: '', esPasada: false };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [year, month, day] = proximaFechaStr.split('-');
    const fechaEvento = new Date(year, month - 1, day);
    fechaEvento.setHours(0, 0, 0, 0);

    const diffTime = fechaEvento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { text: '¡Es hoy!', esPasada: false };
    } else if (diffDays === 1) {
        return { text: 'Falta 1 día', esPasada: false };
    } else if (diffDays > 1) {
        return { text: `Faltan ${diffDays} días`, esPasada: false };
    } else {
        if (frecuencia === 'fecha_unica') {
            return { text: 'Fecha pasada', esPasada: true };
        }
        return { text: '', esPasada: false };
    }
}

// Renderizado de tarjetas de milongas
function renderCards(list) {
    grid.innerHTML = '';
    if (list.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';
    list.forEach(m => {
        const card = document.createElement('article');
        card.className = 'milonga';

        const contactoBtn = m.contacto && m.contacto.trim() !== ''
            ? `<a class="btn-wa" target="_blank" rel="noopener" href="https://wa.me/${m.contacto}">WhatsApp</a>`
            : `<span class="btn-no-wa">Sin WhatsApp</span>`;

        const frecuenciaLabel = getFrecuenciaLabel(m.frecuencia, m.proximaFecha);
        const countdown = getCountdownInfo(m.proximaFecha, m.frecuencia);

        card.innerHTML = `
    <iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="${mapEmbedUrl(m.direccion)}" title="Mapa de ${m.nombre}"></iframe>
    <div class="body">
      <h3>${m.nombre}</h3>
      <div class="tags-row">
        <span class="tag-day mono">${m.dia}</span>
        <span class="tag-frecuencia mono">${frecuenciaLabel}</span>
        ${countdown.text ? `<span class="countdown mono ${countdown.esPasada ? 'pasada' : ''}">⏱️ ${countdown.text}</span>` : ''}
      </div>
      <span class="barrio">${m.barrio}</span>
      <span class="meta">${m.horario}</span>
      <span class="addr">${m.direccion}</span>
      ${m.nota ? `<span class="note">${m.nota}</span>` : ''}
      <div class="actions">
        <a class="link-btn primary" target="_blank" rel="noopener" href="${directionsUrl(m.direccion)}">Cómo llegar</a>
        <a class="link-btn" target="_blank" rel="noopener" href="${mapsSearchUrl(m.direccion)}">Ver en Maps</a>
        ${contactoBtn}
      </div>
    </div>
  `;
        grid.appendChild(card);
    });
}

// Renderizado del Directorio de Clases
function renderClases(list) {
    clasesGrid.innerHTML = '';
    if (list.length === 0) {
        clasesEmptyState.style.display = 'block';
        return;
    }
    clasesEmptyState.style.display = 'none';
    list.forEach(c => {
        const card = document.createElement('article');
        card.className = 'clase-card';

        const contactoBtn = c.contacto && c.contacto.trim() !== ''
            ? `<a class="btn-wa" target="_blank" rel="noopener" href="https://wa.me/${c.contacto}">Consultar / Inscribirse</a>`
            : `<span class="btn-no-wa">Sin WhatsApp</span>`;

        // Construcción del HTML de horarios
        let horariosHtml = '';
        if (c.horarios && c.horarios.length > 0) {
            horariosHtml = `<div class="horarios-list">` + 
                c.horarios.map(h => `
                    <div class="horario-item">
                        <div class="horario-header">
                            <span class="tag-day mono" style="font-size: 10.5px; padding: 2px 6px;">${h.dia}</span>
                            <span class="horario-hora">${h.hora}</span>
                        </div>
                        ${h.detalle ? `<div class="horario-detalle">${h.detalle}</div>` : ''}
                    </div>
                `).join('') + 
            `</div>`;
        }

        const tipoStr = c.tipo || c.Tipo || '';
        const descStr = c.descripcion || c.Descripcion || '';

        card.innerHTML = `
    <iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="${mapEmbedUrl(c.direccion)}" title="Mapa de ${c.nombre}"></iframe>
    <div class="body">
      <h3>${c.nombre}</h3>
      <div class="tags-row">
        ${tipoStr ? `<span class="tag-day mono" style="background:#342A24; border:1px solid var(--line);">${tipoStr}</span>` : ''}
        <span class="tag-frecuencia mono">${c.frecuencia}</span>
      </div>
      <span class="barrio">${c.barrio}</span>
      ${horariosHtml}
      <span class="addr">📍 ${c.direccion}</span>
      ${descStr ? `<span class="note">ℹ️ ${descStr}</span>` : ''}
      <div class="actions">
        <a class="link-btn primary" target="_blank" rel="noopener" href="${directionsUrl(c.direccion)}">Cómo llegar</a>
        ${contactoBtn}
      </div>
    </div>
  `;
        clasesGrid.appendChild(card);
    });
}

// Aplica Filtros en Milongas
function applyFilters() {
    const filtered = MILONGAS_DATA.filter(m => {
        const dayOk = currentDay === 'todos' || m.dia === currentDay;
        const barrioOk = currentBarrio === 'todos' || m.barrio === currentBarrio;
        return dayOk && barrioOk;
    });
    renderCards(filtered);
}

// Aplica Filtros en Clases
function applyClasesFilters() {
    const filtered = CLASES_DATA.filter(c => {
        const dayOk = currentClaseDay === 'todos' || (c.horarios && c.horarios.some(h => h.dia === currentClaseDay));
        const barrioOk = currentClaseBarrio === 'todos' || c.barrio === currentClaseBarrio;
        return dayOk && barrioOk;
    });
    renderClases(filtered);
}

// Configurar botones de día para Milongas
document.querySelectorAll('#filtersBar .day-chip').forEach(btn => {
    if (btn.dataset.day === hoyNombre) {
        btn.setAttribute('aria-pressed', 'true');
    } else {
        btn.setAttribute('aria-pressed', 'false');
    }

    btn.addEventListener('click', () => {
        document.querySelectorAll('#filtersBar .day-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        currentDay = btn.dataset.day;
        applyFilters();
    });
});

barrioSelect.addEventListener('change', (e) => {
    currentBarrio = e.target.value;
    applyFilters();
});

// Configurar botones de día para Clases (Selecciona hoyNombre por defecto)
document.querySelectorAll('#clasesFiltersBar .clase-day-chip').forEach(btn => {
    if (btn.dataset.day === hoyNombre) {
        btn.setAttribute('aria-pressed', 'true');
    } else {
        btn.setAttribute('aria-pressed', 'false');
    }

    btn.addEventListener('click', () => {
        document.querySelectorAll('#clasesFiltersBar .clase-day-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        currentClaseDay = btn.dataset.day;
        applyClasesFilters();
    });
});

claseBarrioSelect.addEventListener('change', (e) => {
    currentClaseBarrio = e.target.value;
    applyClasesFilters();
});

// Renders Iniciales
applyFilters();
applyClasesFilters();
