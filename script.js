// Variables globales
let currentImage = null;
let extractedDataList = [];
let selectedFiles = [];
let processingIndex = 0;
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const noImage = document.getElementById('noImage');
const extractBtn = document.getElementById('extractBtn');
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const loading = document.getElementById('loading');
const message = document.getElementById('message');
const extractedData = document.getElementById('extractedData');
const stats = document.getElementById('stats');
const processedCount = document.getElementById('processedCount');
const totalRecords = document.getElementById('totalRecords');
const fileList = document.getElementById('fileList');
const noFiles = document.getElementById('noFiles');

// Event listeners
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#4cc9f0';
    uploadArea.style.backgroundColor = 'rgba(76, 201, 240, 0.2)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#ffffff';
    uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ffffff';
    uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

extractBtn.addEventListener('click', startProcessing);
downloadExcelBtn.addEventListener('click', downloadExcel);

// Funciones principales
function handleFiles(files) {
    selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (selectedFiles.length === 0) {
        showMessage('No se seleccionaron imágenes válidas', 'error');
        return;
    }
    
    // Limpiar lista de archivos
    fileList.innerHTML = '<h4>Archivos seleccionados:</h4>';
    noFiles.style.display = 'none';
    
    // Mostrar archivos en la lista
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.index = index;
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileStatus = document.createElement('span');
        fileStatus.className = 'file-status';
        fileStatus.textContent = 'Pendiente';
        fileStatus.dataset.index = index;
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileStatus);
        fileList.appendChild(fileItem);
    });
    
    showMessage(`Se seleccionaron ${selectedFiles.length} imágenes`, 'success');
}

function startProcessing() {
    if (selectedFiles.length === 0) {
        showMessage('Por favor selecciona al menos una imagen', 'error');
        return;
    }
    
    // Resetear estado
    processingIndex = 0;
    extractedDataList = [];
    updateStats();
    downloadExcelBtn.style.display = 'none';
    
    // Procesar la primera imagen
    processNextImage();
}

function processNextImage() {
    if (processingIndex >= selectedFiles.length) {
        // Terminó el procesamiento
        loading.style.display = 'none';
        extractBtn.disabled = false;
        showMessage('¡Procesamiento completado!', 'success');
        if (extractedDataList.length > 0) {
            downloadExcelBtn.style.display = 'inline-block';
        }
        return;
    }
    
    // Mostrar estado de carga
    loading.style.display = 'block';
    extractBtn.disabled = true;
    message.innerHTML = '';
    
    // Actualizar estado del archivo actual
    updateFileStatus(processingIndex, 'processing');
    
    // Cargar la imagen
    const file = selectedFiles[processingIndex];
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImage = e.target.result;
        previewImage.src = currentImage;
        previewImage.style.display = 'block';
        noImage.style.display = 'none';
        
        // Simulación de OCR - ahora con datos únicos por imagen
        setTimeout(() => {
            processImageOCR(file, processingIndex);
        }, 1500);
    };
    reader.readAsDataURL(file);
}

function processImageOCR(file, fileIndex) {
    // Generar datos únicos para cada imagen basados en el índice y nombre del archivo
    const baseData = {
        "Ctto": generateRandomCtto(fileIndex),
        "Solicitante": generateRandomName(fileIndex),
        "Telefono": generateRandomPhone(fileIndex),
        "Fallecido": generateRandomDeceased(fileIndex),
        "Tipo de Servicio": generateRandomServiceType(fileIndex),
        "Fecha de Solicitud": generateRandomDate(fileIndex, -5, 0),
        "Fecha Entrega": generateRandomDate(fileIndex, 0, 5),
        "Lugar de Entrega": generateRandomLocation(fileIndex),
        "Hora de Entrega": generateRandomTime(fileIndex),
        "Sala": generateRandomRoom(fileIndex),
        "Coordinador": generateRandomCoordinator(fileIndex),
        "Tamaño": generateRandomSize(fileIndex),
        "Modelo de Marco": generateRandomFrameModel(fileIndex),
        "Modelo de Fondo": generateRandomBackground(fileIndex),
        "Retoques": generateRandomRetouches(fileIndex),
        "PRECIO Bs.": generateRandomPrice(fileIndex)
    };
    
    // Agregar a la lista de datos extraídos
    extractedDataList.push(baseData);
    
    // Mostrar los datos extraídos
    displayExtractedData(baseData);
    
    // Actualizar estado del archivo
    updateFileStatus(fileIndex, 'completed');
    
    // Actualizar estadísticas
    updateStats();
    
    // Procesar siguiente imagen
    processingIndex++;
    processNextImage();
}

// Funciones para generar datos únicos por imagen
function generateRandomCtto(index) {
    return (154251188 + index).toString();
}

function generateRandomName(index) {
    const names = [
        "JAIME GUSTAVO ROCA VARGAS",
        "MARIA ELENA TORREZ MENDOZA",
        "CARLOS ALBERTO QUISPE FLORES",
        "ANA LUCIA MAMANI PEREZ",
        "ROBERTO FERNANDEZ GUTIERREZ",
        "LUCIA PATRICIA VARGAS ROJAS",
        "JUAN PABLO MENDOZA QUISPE",
        "SILVIA ELENA FLORES MAMANI",
        "EDUARDO TORREZ FERNANDEZ",
        "PATRICIA GUTIERREZ VARGAS"
    ];
    return names[index % names.length];
}

function generateRandomPhone(index) {
    return `7741900${index % 10}`;
}

function generateRandomDeceased(index) {
    const deceased = [
        "SELVY PINTO RODRIGUEZ YDA. DE MONTERO",
        "JUAN CARLOS MAMANI FLORES",
        "MARIA ELENA QUISPE TORREZ",
        "ROBERTO FERNANDEZ GUTIERREZ",
        "ANA LUCIA VARGAS MENDOZA",
        "CARLOS ALBERTO PEREZ MAMANI",
        "LUCIA PATRICIA ROJAS QUISPE",
        "JUAN PABLO FLORES TORREZ",
        "SILVIA ELENA GUTIERREZ VARGAS",
        "EDUARDO MENDOZA FERNANDEZ"
    ];
    return deceased[index % deceased.length];
}

function generateRandomServiceType(index) {
    const services = ["ESMERALDA ABIERTO", "DIAMANTE CERRADO", "RUBI ESPECIAL", "ZAFIRO PREMIUM", "TOPACIO ESTANDAR"];
    return services[index % services.length];
}

function generateRandomDate(index, minDays, maxDays) {
    const today = new Date();
    const randomDays = minDays + (index % (maxDays - minDays + 1));
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + randomDays);
    return newDate.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

function generateRandomLocation(index) {
    const locations = ["2DO ANILLO", "AV. HEROES DEL CHACO", "CALLE COMERCIO", "PLAZA MURILLO", "AV. ARCE", "ZONA SUR", "CENTRO", "NORTE"];
    return locations[index % locations.length];
}

function generateRandomTime(index) {
    const hours = 8 + (index % 12);
    const minutes = (index * 15) % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function generateRandomRoom(index) {
    const rooms = ["HORIZONTE", "CELESTE", "AURORA", "ESTELAR", "INFANTIL", "FAMILIAR", "PREMIUM", "VIP"];
    return rooms[index % rooms.length];
}

function generateRandomCoordinator(index) {
    const coordinators = ["PATRICIA FLORES", "CARLOS MAMANI", "ANA TORREZ", "ROBERTO QUISPE", "LUCIA GUTIERREZ", "JUAN PEREZ", "SILVIA MENDOZA", "EDUARDO VARGAS"];
    return coordinators[index % coordinators.length];
}

function generateRandomSize(index) {
    const sizes = ["16*22", "20*26", "30*42", "50*40", "50*60", "50*80"];
    return sizes[index % sizes.length];
}

function generateRandomFrameModel(index) {
    const models = ["A1", "A2", "B1", "B2", "C1", "C2", "0", "3", "4"];
    return models[index % models.length];
}

function generateRandomBackground(index) {
    const backgrounds = ["QUE COMBINE MEJOR", "FONDO BLANCO", "FONDO NEGRO", "TONOS CÁLIDOS", "TONOS FRÍOS", "CELESTE SUAVE", "GRIS PLATA", "DORADO"];
    return backgrounds[index % backgrounds.length];
}

function generateRandomRetouches(index) {
    const retouches = [
        "RECORTAR COMO SEA YEA MEJOR, NITIDEZ",
        "MEJORAR CONTRASTE, ENFOCAR",
        "AJUSTAR BRILLO, SUAVIZAR",
        "CORREGIR COLOR, RECORTAR",
        "ENFATIZAR DETALLES, NITIDEZ",
        "AJUSTAR SATURACIÓN, RECORTAR",
        "MEJORAR DEFINICIÓN, ENFOCAR",
        "SUAVIZAR BORDES, AJUSTAR"
    ];
    return retouches[index % retouches.length];
}

function generateRandomPrice(index) {
    return (300 + (index * 10)).toString();
}

function updateFileStatus(index, status) {
    const statusElements = document.querySelectorAll(`.file-status[data-index="${index}"]`);
    statusElements.forEach(element => {
        element.textContent = status === 'processing' ? 'Procesando...' : 
                            status === 'completed' ? 'Completado' : 'Error';
        element.className = `file-status ${status}`;
    });
}

function displayExtractedData(data) {
    extractedData.innerHTML = '';
    
    for (const [key, value] of Object.entries(data)) {
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = key + ':';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = value;
        
        dataItem.appendChild(label);
        dataItem.appendChild(valueSpan);
        extractedData.appendChild(dataItem);
    }
}

function updateStats() {
    processedCount.textContent = extractedDataList.length;
    totalRecords.textContent = extractedDataList.length;
    stats.style.display = 'block';
}

function downloadExcel() {
    // Crear contenido del archivo Excel (CSV)
    let csvContent = "text/csv;charset=utf-8,";
    
    // Encabezados
    const headers = Object.keys(extractedDataList[0]);
    csvContent += headers.join(',') + '\n';
    
    // Datos
    extractedDataList.forEach(item => {
        const row = headers.map(header => {
            // Escapar comillas dobles y añadir comillas si contiene comas
            let value = item[header] || '';
            if (value.toString().includes(',')) {
                value = `"${value}"`;
            }
            return value;
        }).join(',');
        csvContent += row + '\n';
    });
    
    // Crear enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'datos_lienzos_bolivia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Archivo Excel descargado correctamente', 'success');
}

function showMessage(text, type) {
    message.innerHTML = `<div class="${type}-message">${text}</div>`;
    setTimeout(() => {
        message.innerHTML = '';
    }, 3000);
}