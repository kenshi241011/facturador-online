document.addEventListener('DOMContentLoaded', () => {

    // --- REFERENCIAS AL DOM ---
    const itemForm = document.getElementById('item-form');
    const descripcionInput = document.getElementById('descripcion');
    const precioInput = document.getElementById('precio');
    const itemsList = document.getElementById('items-list');
    const totalSpan = document.getElementById('total');
    const imprimirBtn = document.getElementById('imprimir-btn');
    const historialList = document.getElementById('historial-list');
    const comprobanteDiv = document.getElementById('comprobante-impresion');
    // Se eliminan los botones y contenedores de historial protegido para simplificar
    
    // --- ESTADO DE LA APLICACIÓN ---
    let items = [];
    let historial = [];

    // --- FUNCIONES DE RENDERIZADO (Mayormente sin cambios) ---
    function renderItems() {
        itemsList.innerHTML = '';
        if (items.length === 0) {
            itemsList.innerHTML = '<p style="color: #6c757d; text-align: center;">Aún no has agregado productos.</p>';
        } else {
            items.forEach((item, index) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `<div class="item-details"><span class="item-description">${item.descripcion}</span><span class="item-price">S/ ${item.precio.toFixed(2)}</span></div><button class="btn-remove" data-index="${index}" title="Eliminar item">×</button>`;
                itemsList.appendChild(itemCard);
            });
        }
        actualizarTotal();
    }

    function renderHistorial() {
        historialList.innerHTML = '';
        if (historial.length === 0) {
            historialList.innerHTML = '<p style="color: #6c757d; text-align: center;">El historial está vacío.</p>';
        } else {
            // No es necesario el .slice().reverse() porque ya lo ordenamos en la consulta SQL
            historial.forEach(comprobante => {
                const historialCard = document.createElement('div');
                historialCard.className = 'historial-card';
                historialCard.dataset.id = comprobante.id;
                historialCard.innerHTML = `<div class="historial-card-info"><div class="date">Comprobante del ${comprobante.fecha}</div><div class="time">${comprobante.hora}</div></div><div class="historial-card-total">S/ ${parseFloat(comprobante.total).toFixed(2)}</div>`;
                historialList.appendChild(historialCard);
            });
        }
    }
    
    function actualizarTotal() {
        const total = items.reduce((sum, item) => sum + item.precio, 0);
        totalSpan.textContent = `S/ ${total.toFixed(2)}`;
    }

    // --- LÓGICA DE DATOS CONEXIÓN AL BACKEND ---
    async function cargarHistorial() {
        try {
            const response = await fetch('/.netlify/functions/get-comprobantes');
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            historial = await response.json();
            renderHistorial();
        } catch (error) {
            console.error('No se pudo cargar el historial:', error);
            historialList.innerHTML = '<p style="color: red; text-align: center;">Error al cargar el historial.</p>';
        }
    }

    async function guardarComprobanteEnDB(comprobante) {
        try {
            await fetch('/.netlify/functions/add-comprobante', {
                method: 'POST',
                body: JSON.stringify(comprobante)
            });
        } catch (error) {
            console.error('No se pudo guardar el comprobante:', error);
            alert('Error: El comprobante no se pudo guardar en la base de datos.');
        }
    }

    function generarHtmlImpresion(comprobante) { /* ...código sin cambios... */ }

    // --- EVENT LISTENERS ---
    itemForm.addEventListener('submit', e => { /* ...código sin cambios... */ });
    itemsList.addEventListener('click', e => { /* ...código sin cambios... */ });

    imprimirBtn.addEventListener('click', async () => {
        if (items.length === 0) {
            alert('Agrega al menos un item para imprimir un comprobante.');
            return;
        }

        const ahora = new Date();
        const nuevoComprobante = {
            id: ahora.getTime(),
            fecha: ahora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
            items: [...items],
            total: items.reduce((sum, item) => sum + item.precio, 0)
        };

        // 1. Guardar en la base de datos
        await guardarComprobanteEnDB(nuevoComprobante);

        // 2. Actualizar el historial localmente y renderizar
        historial.unshift(nuevoComprobante);
        renderHistorial();
        
        // 3. Imprimir
        generarHtmlImpresion(nuevoComprobante);
        window.print();
        
        // 4. Limpiar para el siguiente comprobante
        items = [];
        renderItems();
    });

    historialList.addEventListener('click', e => { /* ...código sin cambios... */ });
    
    // --- INICIALIZACIÓN ---
    cargarHistorial();
    renderItems();

    // --- Pegando aquí las funciones sin cambios para que el archivo esté completo ---
    function generarHtmlImpresion(comprobante) { let itemsHtml = comprobante.items.map(item => `<tr><td style="padding-right: 15px;">${item.descripcion}</td><td style="text-align: right;">S/ ${parseFloat(item.precio).toFixed(2)}</td></tr>`).join(''); comprobanteDiv.innerHTML = `<div style="width: 280px; margin: auto; padding: 10px; border: 1px solid #333;"><h2 style="text-align: center; margin: 0; font-size: 16px;">COMPROBANTE DE PAGO</h2><p style="text-align: center; font-size: 12px; margin: 5px 0;">------------------------------</p><p><strong>Fecha:</strong> ${comprobante.fecha}</p><p><strong>Hora:</strong> ${comprobante.hora}</p><p style="margin-top: 15px; border-top: 1px dashed #333; padding-top: 5px;"><strong>DETALLE:</strong></p><table style="width: 100%; border-collapse: collapse; font-size: 14px;"><tbody>${itemsHtml}</tbody></table><p style="text-align: center; font-size: 12px; margin: 5px 0;">------------------------------</p><h3 style="text-align: right; margin-right: 10px; font-size: 16px;">TOTAL: S/ ${parseFloat(comprobante.total).toFixed(2)}</h3><p style="text-align: center; font-size: 12px; margin-top: 20px;">¡Gracias por su preferencia!</p></div>`; }
    itemForm.addEventListener('submit', e => { e.preventDefault(); const d = descripcionInput.value.trim(), p = parseFloat(precioInput.value); if (d && !isNaN(p) && p > 0) { items.push({ descripcion: d, precio: p }); renderItems(); itemForm.reset(); descripcionInput.focus(); } });
    itemsList.addEventListener('click', e => { if (e.target.classList.contains('btn-remove')) { const i = parseInt(e.target.dataset.index); items.splice(i, 1); renderItems(); } });
    historialList.addEventListener('click', e => { const c = e.target.closest('.historial-card'); if (c) { const id = parseInt(c.dataset.id), comp = historial.find(c => c.id == id); if (comp) { generarHtmlImpresion(comp); window.print(); } } });
});