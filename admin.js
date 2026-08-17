/* =========================================================================
   PANEL DE CONTROL OCULTO (admin)
   - Cambiá la contraseña acá abajo antes de publicar el sitio.
   - Acceso: click en el puntito casi invisible al lado del texto del
     footer, o el atajo de teclado Ctrl+Alt+A.
   - Los cambios se guardan en localStorage (solo en este navegador).
     Usá la pestaña "Exportar / Restaurar" para copiar el código
     actualizado y pegarlo en el archivo HTML, así queda visible
     para todas las personas que visiten el sitio.
========================================================================== */
(function () {
    const ADMIN_PASSWORD = "surtango2026"; // 👈 cambiá esta contraseña
    const LS_MILONGAS = "amds_milongas_override";
    const LS_CLASES = "amds_clases_override";
    const LS_SESSION = "amds_admin_session";

    let isAdmin = sessionStorage.getItem(LS_SESSION) === "1";

    // --- Cargar overrides guardados (si existen) antes de que la página ya renderizó con los datos default ---
    function loadOverrides() {
        try {
            const savedM = localStorage.getItem(LS_MILONGAS);
            if (savedM) {
                const parsed = JSON.parse(savedM);
                MILONGAS_DATA.length = 0;
                parsed.forEach(item => MILONGAS_DATA.push(item));
            }
            const savedC = localStorage.getItem(LS_CLASES);
            if (savedC) {
                const parsed = JSON.parse(savedC);
                CLASES_DATA.length = 0;
                parsed.forEach(item => CLASES_DATA.push(item));
            }
        } catch (e) {
            console.warn("No se pudieron cargar los cambios guardados del panel:", e);
        }
    }

    function persistMilongas() {
        localStorage.setItem(LS_MILONGAS, JSON.stringify(MILONGAS_DATA));
    }
    function persistClases() {
        localStorage.setItem(LS_CLASES, JSON.stringify(CLASES_DATA));
    }

    // --- Refresca selects de barrio y tira de barrios tras cambios en los datos ---
    function refreshBarriosUI() {
        barrioSelect.innerHTML = '<option value="todos">Todos</option>';
        barriosStrip.innerHTML = '';
        const nuevosBarriosMilongas = [...new Set(MILONGAS_DATA.map(m => m.barrio))].sort();
        nuevosBarriosMilongas.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b; opt.textContent = b;
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
        if (![...barrioSelect.options].some(o => o.value === currentBarrio)) currentBarrio = 'todos';
        barrioSelect.value = currentBarrio;

        claseBarrioSelect.innerHTML = '<option value="todos">Todos</option>';
        const nuevosBarriosClases = [...new Set(CLASES_DATA.map(c => c.barrio))].sort();
        nuevosBarriosClases.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b; opt.textContent = b;
            claseBarrioSelect.appendChild(opt);
        });
        if (![...claseBarrioSelect.options].some(o => o.value === currentClaseBarrio)) currentClaseBarrio = 'todos';
        claseBarrioSelect.value = currentClaseBarrio;
    }

    function refreshAll() {
        refreshBarriosUI();
        applyFilters();
        applyClasesFilters();
    }

    loadOverrides();
    refreshAll();

    // ---------- Referencias DOM ----------
    const adminTrigger = document.getElementById('adminTrigger');
    const loginOverlay = document.getElementById('adminLoginOverlay');
    const loginClose = document.getElementById('adminLoginClose');
    const passwordInput = document.getElementById('adminPasswordInput');
    const loginSubmit = document.getElementById('adminLoginSubmit');
    const loginError = document.getElementById('adminLoginError');

    const panelOverlay = document.getElementById('adminPanelOverlay');
    const panelClose = document.getElementById('adminPanelClose');
    const tabs = document.querySelectorAll('.admin-tab');
    const tabMilongas = document.getElementById('adminTabMilongas');
    const tabClases = document.getElementById('adminTabClases');
    const tabExport = document.getElementById('adminTabExport');

    const milongaListItems = document.getElementById('adminMilongaListItems');
    const claseListItems = document.getElementById('adminClaseListItems');
    const addMilongaBtn = document.getElementById('adminAddMilonga');
    const addClaseBtn = document.getElementById('adminAddClase');

    const exportOutput = document.getElementById('adminExportOutput');
    const exportMilongasBtn = document.getElementById('adminExportMilongas');
    const exportClasesBtn = document.getElementById('adminExportClases');
    const resetAllBtn = document.getElementById('adminResetAll');
    const logoutBtn = document.getElementById('adminLogout');

    const milongaFormOverlay = document.getElementById('adminMilongaFormOverlay');
    const milongaFormClose = document.getElementById('adminMilongaFormClose');
    const milongaFormTitle = document.getElementById('adminMilongaFormTitle');
    const mf_delete = document.getElementById('mf_delete');
    const mf_save = document.getElementById('mf_save');

    const claseFormOverlay = document.getElementById('adminClaseFormOverlay');
    const claseFormClose = document.getElementById('adminClaseFormClose');
    const claseFormTitle = document.getElementById('adminClaseFormTitle');
    const cf_delete = document.getElementById('cf_delete');
    const cf_save = document.getElementById('cf_save');
    const cf_horariosList = document.getElementById('cf_horariosList');
    const cf_addHorario = document.getElementById('cf_addHorario');

    // ---------- Apertura / cierre ----------
    function openLogin() {
        loginError.style.display = 'none';
        passwordInput.value = '';
        loginOverlay.classList.add('open');
        setTimeout(() => passwordInput.focus(), 50);
    }
    function closeLogin() { loginOverlay.classList.remove('open'); }

    function openPanel() {
        renderAdminMilongaList();
        renderAdminClaseList();
        panelOverlay.classList.add('open');
    }
    function closePanel() { panelOverlay.classList.remove('open'); }

    function tryOpenAdmin() {
        if (isAdmin) {
            openPanel();
        } else {
            openLogin();
        }
    }

    adminTrigger.addEventListener('click', tryOpenAdmin);
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            tryOpenAdmin();
        }
    });

    loginClose.addEventListener('click', closeLogin);
    loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) closeLogin(); });
    loginSubmit.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });

    function attemptLogin() {
        if (passwordInput.value === ADMIN_PASSWORD) {
            isAdmin = true;
            sessionStorage.setItem(LS_SESSION, '1');
            closeLogin();
            openPanel();
        } else {
            loginError.style.display = 'block';
        }
    }

    panelClose.addEventListener('click', closePanel);
    panelOverlay.addEventListener('click', (e) => { if (e.target === panelOverlay) closePanel(); });

    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        sessionStorage.removeItem(LS_SESSION);
        closePanel();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabMilongas.style.display = 'none';
            tabClases.style.display = 'none';
            tabExport.style.display = 'none';
            const target = tab.dataset.adminTab;
            if (target === 'milongas') tabMilongas.style.display = 'block';
            if (target === 'clases') tabClases.style.display = 'block';
            if (target === 'export') tabExport.style.display = 'block';
        });
    });

    // ---------- Listado admin: Milongas ----------
    function renderAdminMilongaList() {
        milongaListItems.innerHTML = '';
        if (MILONGAS_DATA.length === 0) {
            milongaListItems.innerHTML = '<p class="sub-admin">No hay milongas cargadas.</p>';
            return;
        }
        MILONGAS_DATA.forEach((m, idx) => {
            const row = document.createElement('div');
            row.className = 'admin-item';
            row.innerHTML = `
                <div class="admin-item-info">
                    <strong>${m.nombre}</strong>
                    <span>${m.dia} · ${m.barrio}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn small" data-edit="${idx}">Editar</button>
                    <button class="admin-btn small danger" data-del="${idx}">Eliminar</button>
                </div>`;
            row.querySelector('[data-edit]').addEventListener('click', () => openMilongaForm(idx));
            row.querySelector('[data-del]').addEventListener('click', () => deleteMilonga(idx));
            milongaListItems.appendChild(row);
        });
    }

    function deleteMilonga(idx) {
        if (!confirm(`¿Eliminar "${MILONGAS_DATA[idx].nombre}"?`)) return;
        MILONGAS_DATA.splice(idx, 1);
        persistMilongas();
        renderAdminMilongaList();
        refreshAll();
    }

    // ---------- Formulario Milonga ----------
    const mfFields = ['nombre', 'barrio', 'dia', 'frecuencia', 'proximaFecha', 'horario', 'direccion', 'nota', 'contacto'];

    function openMilongaForm(idx) {
        document.getElementById('mf_index').value = idx;
        if (idx === -1) {
            milongaFormTitle.textContent = 'Agregar milonga';
            mf_delete.style.display = 'none';
            mfFields.forEach(f => document.getElementById('mf_' + f).value = '');
            document.getElementById('mf_dia').value = 'Sábado';
            document.getElementById('mf_frecuencia').value = 'semanal';
        } else {
            const m = MILONGAS_DATA[idx];
            milongaFormTitle.textContent = 'Editar milonga';
            mf_delete.style.display = 'inline-block';
            mfFields.forEach(f => document.getElementById('mf_' + f).value = m[f] || '');
        }
        milongaFormOverlay.classList.add('open');
    }
    function closeMilongaForm() { milongaFormOverlay.classList.remove('open'); }

    addMilongaBtn.addEventListener('click', () => openMilongaForm(-1));
    milongaFormClose.addEventListener('click', closeMilongaForm);
    milongaFormOverlay.addEventListener('click', (e) => { if (e.target === milongaFormOverlay) closeMilongaForm(); });

    mf_save.addEventListener('click', () => {
        const idx = parseInt(document.getElementById('mf_index').value, 10);
        const nombre = document.getElementById('mf_nombre').value.trim();
        const direccion = document.getElementById('mf_direccion').value.trim();
        if (!nombre || !direccion) {
            alert('Completá al menos el nombre y la dirección.');
            return;
        }
        const data = {};
        mfFields.forEach(f => data[f] = document.getElementById('mf_' + f).value.trim());
        if (idx === -1) {
            MILONGAS_DATA.push(data);
        } else {
            MILONGAS_DATA[idx] = data;
        }
        persistMilongas();
        closeMilongaForm();
        renderAdminMilongaList();
        refreshAll();
    });

    mf_delete.addEventListener('click', () => {
        const idx = parseInt(document.getElementById('mf_index').value, 10);
        if (idx === -1) return;
        closeMilongaForm();
        deleteMilonga(idx);
    });

    // ---------- Listado admin: Clases ----------
    function renderAdminClaseList() {
        claseListItems.innerHTML = '';
        if (CLASES_DATA.length === 0) {
            claseListItems.innerHTML = '<p class="sub-admin">No hay clases cargadas.</p>';
            return;
        }
        CLASES_DATA.forEach((c, idx) => {
            const row = document.createElement('div');
            row.className = 'admin-item';
            row.innerHTML = `
                <div class="admin-item-info">
                    <strong>${c.nombre}</strong>
                    <span>${c.barrio} · ${(c.horarios || []).map(h => h.dia).join(', ')}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn small" data-edit="${idx}">Editar</button>
                    <button class="admin-btn small danger" data-del="${idx}">Eliminar</button>
                </div>`;
            row.querySelector('[data-edit]').addEventListener('click', () => openClaseForm(idx));
            row.querySelector('[data-del]').addEventListener('click', () => deleteClase(idx));
            claseListItems.appendChild(row);
        });
    }

    function deleteClase(idx) {
        if (!confirm(`¿Eliminar "${CLASES_DATA[idx].nombre}"?`)) return;
        CLASES_DATA.splice(idx, 1);
        persistClases();
        renderAdminClaseList();
        refreshAll();
    }

    // ---------- Formulario Clase (con horarios dinámicos) ----------
    const cfFields = ['nombre', 'barrio', 'tipo', 'frecuencia', 'direccion', 'descripcion', 'contacto'];
    let horariosBuffer = [];

    function renderHorariosBuffer() {
        cf_horariosList.innerHTML = '';
        horariosBuffer.forEach((h, i) => {
            const row = document.createElement('div');
            row.className = 'admin-horario-row';
            row.innerHTML = `
                <select data-h-dia>
                    ${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => `<option ${d === h.dia ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
                <input type="text" data-h-hora placeholder="Hora (ej: 20:00 hs)" value="${h.hora || ''}">
                <input type="text" data-h-detalle placeholder="Detalle (opcional)" value="${h.detalle || ''}">
                <button class="admin-btn small danger" type="button" data-h-del>✕</button>
            `;
            row.querySelector('[data-h-dia]').addEventListener('change', (e) => horariosBuffer[i].dia = e.target.value);
            row.querySelector('[data-h-hora]').addEventListener('input', (e) => horariosBuffer[i].hora = e.target.value);
            row.querySelector('[data-h-detalle]').addEventListener('input', (e) => horariosBuffer[i].detalle = e.target.value);
            row.querySelector('[data-h-del]').addEventListener('click', () => {
                horariosBuffer.splice(i, 1);
                renderHorariosBuffer();
            });
            cf_horariosList.appendChild(row);
        });
    }

    cf_addHorario.addEventListener('click', () => {
        horariosBuffer.push({ dia: 'Lunes', hora: '', detalle: '' });
        renderHorariosBuffer();
    });

    function openClaseForm(idx) {
        document.getElementById('cf_index').value = idx;
        if (idx === -1) {
            claseFormTitle.textContent = 'Agregar clase';
            cf_delete.style.display = 'none';
            cfFields.forEach(f => document.getElementById('cf_' + f).value = '');
            horariosBuffer = [{ dia: 'Lunes', hora: '', detalle: '' }];
        } else {
            const c = CLASES_DATA[idx];
            claseFormTitle.textContent = 'Editar clase';
            cf_delete.style.display = 'inline-block';
            cfFields.forEach(f => document.getElementById('cf_' + f).value = c[f] || '');
            horariosBuffer = JSON.parse(JSON.stringify(c.horarios || []));
            if (horariosBuffer.length === 0) horariosBuffer = [{ dia: 'Lunes', hora: '', detalle: '' }];
        }
        renderHorariosBuffer();
        claseFormOverlay.classList.add('open');
    }
    function closeClaseForm() { claseFormOverlay.classList.remove('open'); }

    addClaseBtn.addEventListener('click', () => openClaseForm(-1));
    claseFormClose.addEventListener('click', closeClaseForm);
    claseFormOverlay.addEventListener('click', (e) => { if (e.target === claseFormOverlay) closeClaseForm(); });

    cf_save.addEventListener('click', () => {
        const idx = parseInt(document.getElementById('cf_index').value, 10);
        const nombre = document.getElementById('cf_nombre').value.trim();
        const direccion = document.getElementById('cf_direccion').value.trim();
        if (!nombre || !direccion) {
            alert('Completá al menos el nombre y la dirección.');
            return;
        }
        const data = {};
        cfFields.forEach(f => data[f] = document.getElementById('cf_' + f).value.trim());
        data.horarios = horariosBuffer
            .filter(h => h.hora && h.hora.trim() !== '')
            .map(h => ({ dia: h.dia, hora: h.hora.trim(), detalle: (h.detalle || '').trim() }));
        if (idx === -1) {
            CLASES_DATA.push(data);
        } else {
            CLASES_DATA[idx] = data;
        }
        persistClases();
        closeClaseForm();
        renderAdminClaseList();
        refreshAll();
    });

    cf_delete.addEventListener('click', () => {
        const idx = parseInt(document.getElementById('cf_index').value, 10);
        if (idx === -1) return;
        closeClaseForm();
        deleteClase(idx);
    });

    // ---------- Exportar / Restaurar ----------
    function jsStringForArray(arr, varName) {
        // Genera el código formateado tal como iría pegado en el <script> del sitio.
        const json = JSON.stringify(arr, null, 4)
            .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:'); // claves sin comillas, estilo del archivo original
        return `const ${varName} = ${json};`;
    }

    exportMilongasBtn.addEventListener('click', () => {
        exportOutput.value = jsStringForArray(MILONGAS_DATA, 'MILONGAS_DATA');
    });
    exportClasesBtn.addEventListener('click', () => {
        exportOutput.value = jsStringForArray(CLASES_DATA, 'CLASES_DATA');
    });

    resetAllBtn.addEventListener('click', () => {
        if (!confirm('Esto borra todos los cambios guardados en este navegador y vuelve a los datos originales del archivo. ¿Continuar?')) return;
        localStorage.removeItem(LS_MILONGAS);
        localStorage.removeItem(LS_CLASES);
        location.reload();
    });
})();
