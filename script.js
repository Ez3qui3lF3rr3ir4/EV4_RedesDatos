// Estados posibles de comunicación
const STATUS = {
    STABLE: 'Estable',
    OVERLOADED: 'Sobrecargado',
    ERROR: 'Error'
};

// Datos de conexiones (se llenará con la API)
let connections = [];

// Función para renderizar la tabla
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    connections.forEach(connection => {
        const row = document.createElement('tr');
        
        // Celda de origen
        const fromCell = document.createElement('td');
        fromCell.textContent = connection.from;
        
        // Celda de destino
        const toCell = document.createElement('td');
        toCell.textContent = connection.to;
        
        // Celda de estatus
        const statusCell = document.createElement('td');
        statusCell.innerHTML = `
            <div class="status-cell">
                <span class="status-indicator status-${connection.status.toLowerCase()}"></span>
                ${connection.status}
            </div>
        `;
        
        // Celda de latencia
        const latencyCell = document.createElement('td');
        latencyCell.textContent = connection.latency + ' ms';

        // Celda de hora
        const timeCell = document.createElement('td');
        timeCell.textContent = connection.time;
        
        row.appendChild(fromCell);
        row.appendChild(toCell);
        row.appendChild(statusCell);
        row.appendChild(latencyCell);
        row.appendChild(timeCell);
        
        tableBody.appendChild(row);
    });
}

// Función para consultar la API detrás de Nginx
async function fetchApiData() {
    const startTime = performance.now();
    try {
        // Añadimos '?t=...' para evitar que el navegador guarde la respuesta en caché
        const response = await fetch('http://localhost/health?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const latency = Math.round(performance.now() - startTime);
        
        // El servidor que respondió a través del balanceador
        const serverName = data.server_name;
        
        const newConnection = {
            from: 'Nginx (LB)', // Origen aparente de la petición o balanceador
            to: serverName,      // Servidor backend que procesó la petición
            status: data.status === 'OK' ? STATUS.STABLE : STATUS.ERROR,
            latency: latency,
            // Forzamos que se muestren los segundos
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        // Insertamos la nueva petición al principio (arriba) de la tabla
        connections.unshift(newConnection);
        
        // Mantenemos solo los últimos 15 registros para que la tabla no crezca al infinito
        if (connections.length > 15) {
            connections.pop();
        }

    } catch (error) {
        console.error('Error al conectar con la API:', error);
        
        // Si hay error, insertamos un registro de caída
        const latency = Math.round(performance.now() - startTime);
        
        const errorConnection = {
            from: 'Nginx (LB)',
            to: 'API / Desconocido',
            status: STATUS.ERROR,
            latency: latency,
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        connections.unshift(errorConnection);
        if (connections.length > 15) {
            connections.pop();
        }
    }
    
    // Renderizamos los cambios
    renderTable();
}

// Inicializar
function init() {
    renderTable();
    
    // Obtener los datos inmediatamente
    fetchApiData();
    
    // Consultar la API cada 2 segundos
    setInterval(fetchApiData, 2000);
}

// Llamar a init cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

