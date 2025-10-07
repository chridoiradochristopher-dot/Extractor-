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

// Valores permitidos
const VALID_SIZES = ["16*22", "20*27", "30*42", "50*40", "50*60", "50*80"];
const VALID_FRAME_MODELS = ["A1", "A2", "B1", "B2", "C1", "C2", "0", "3", "4"];

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
    reader.onload = async function(e) {
        currentImage = e.target.result;
        previewImage.src = currentImage;
        previewImage.style.display = 'block';
        noImage.style.display = 'none';
        
        try {
            // Preprocesar la imagen para mejorar OCR
            const processedImage = await preprocessImage(currentImage);
            
            // Usar Tesseract.js para extraer texto
            const { data: { text } } = await Tesseract.recognize(
                processedImage,
                'spa', // Idioma español
                { 
                    logger: m => console.log(m),
                    tessjs_create_pdf: false,
                    tessjs_pdf_resolution: 300
                }
            );
            
            // Extraer y validar datos del texto reconocido
            const extractedData = extractAndValidateFields(text);
            
            // Guardar los datos extraídos
            extractedDataList.push(extractedData);
            
            // Mostrar los datos extraídos
            displayExtractedData(extractedData);
            
            // Actualizar estado del archivo
            updateFileStatus(processingIndex, 'completed');
            
            // Actualizar estadísticas
            updateStats();
            
        } catch (error) {
            showMessage('Error al procesar la imagen con OCR', 'error');
            console.error('Error OCR:', error);
            updateFileStatus(processingIndex, 'error');
        }
        
        // Procesar siguiente imagen
        processingIndex++;
        processNextImage();
    };
    reader.readAsDataURL(file);
}

// Preprocesar imagen para mejorar OCR (sin CORS)
async function preprocessImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Escalar a 1500px de ancho
            const scale = 1500 / img.width;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convertir a blanco y negro
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const value = avg > 128 ? 255 : 0;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

// Extraer y validar campos del texto
function extractAndValidateFields(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let data = {
        "Ctto": "",
        "Solicitante": "",
        "Telefono": "",
        "Fallecido": "",
        "Tipo de Servicio": "",
        "Fecha de Solicitud": "",
        "Fecha Entrega": "",
        "Lugar de Entrega": "",
        "Hora de Entrega": "",
        "Sala": "",
        "Coordinador": "",
        "Tamaño": "",
        "Modelo de Marco": "",
        "Modelo de Fondo": "",
        "Retoques": "",
        "PRECIO Bs.": ""
    };

    // Buscar cada campo por palabras clave
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase(); // Normalizar a mayúsculas

        // Ctto
        if (line.includes("CTTO:") || line.includes("CTTO")) {
            data.Ctto = extractValue(line, "CTTO:");
        }

        // Solicitante
        if (line.includes("SOLICITANTE") && !line.includes("FALLECIDO")) {
            data.Solicitante = extractValue(line, "SOLICITANTE");
        }

        // Telefono
        if (line.includes("TELEFONO") || line.includes("TELÉFONO")) {
            data.Telefono = extractValue(line, "TELEFONO:");
        }

        // Fallecido
        if (line.includes("FALLECIDO:") || line.includes("FALLECIDO")) {
            data.Fallecido = extractValue(line, "FALLECIDO:");
        }

        // Tipo de Servicio
        if (line.includes("TIPO DE SERVICIO")) {
            data["Tipo de Servicio"] = extractValue(line, "TIPO DE SERVICIO:");
        }

        // Fecha de Solicitud
        if (line.includes("FECHA DE SOLICITUD")) {
            data["Fecha de Solicitud"] = extractValue(line, "FECHA DE SOLICITUD:");
        }

        // Fecha Entrega
        if (line.includes("FECHA ENTREGA")) {
            data["Fecha Entrega"] = extractValue(line, "FECHA ENTREGA:");
        }

        // Lugar de Entrega
        if (line.includes("LUGAR DE ENTREGA")) {
            data["Lugar de Entrega"] = extractValue(line, "LUGAR DE ENTREGA:");
        }

        // Hora de Entrega
        if (line.includes("HORA DE ENTREGA")) {
            data["Hora de Entrega"] = extractValue(line, "HORA DE ENTREGA:");
        }

        // Sala
        if (line.includes("SALA")) {
            data.Sala = extractValue(line, "SALA:");
        }

        // Coordinador
        if (line.includes("COORDINADOR")) {
            data.Coordinador = extractValue(line, "COORDINADOR:");
        }

        // Tamaño
        if (line.includes("TAMAÑO") || line.includes("TAMANO")) {
            let size = extractValue(line, "TAMAÑO:");
            data.Tamaño = validateSize(size);
        }

        // Modelo de Marco
        if (line.includes("MODELO DE MARCO")) {
            let model = extractValue(line, "MODELO DE MARCO:");
            data["Modelo de Marco"] = validateFrameModel(model);
        }

        // Modelo de Fondo
        if (line.includes("MODELO DE FONDO")) {
            data["Modelo de Fondo"] = extractValue(line, "MODELO DE FONDO:");
        }

        // Retoques
        if (line.includes("RETOQUES")) {
            data.Retoques = extractValue(line, "RETOQUES:");
        }

        // PRECIO Bs.
        if (line.includes("PRECIO BS.") || line.includes("PRECIO BS")) {
            data["PRECIO Bs."] = extractValue(line, "PRECIO BS.:");
        }
    }

    // Validar y corregir campos si es necesario
    data = validateAndCorrectData(data);

    return data;
}

// Extraer valor después de una clave
function extractValue(line, key) {
    let value = line.replace(key, '').trim();
    // Limpiar caracteres innecesarios
    value = value.replace(/[^a-zA-Z0-9\s\*\-\:\.\/]/g, '').trim();
    return value || "";
}

// Validar tamaño
function validateSize(size) {
    if (!size) return "";
    
    // Correcciones comunes
    size = size.replace(/\s+/g, ''); // Quitar espacios
    size = size.replace(/x/gi, '*'); // Reemplazar x por *
    size = size.replace(/[^0-9\*]/g, ''); // Solo números y *

    // Si tiene formato de tamaño (ej: 20*27)
    if (/^\d+\*\d+$/.test(size)) {
        // Verificar si coincide con alguno de los permitidos
        const closest = findClosestSize(size);
        return closest || size;
    }

    // Si no es un tamaño válido, devolver vacío
    return "";
}

// Encontrar el tamaño más cercano
function findClosestSize(input) {
    const inputParts = input.split('*').map(Number);
    if (inputParts.length !== 2) return null;

    let bestMatch = null;
    let minDistance = Infinity;

    for (const validSize of VALID_SIZES) {
        const validParts = validSize.split('*').map(Number);
        const distance = Math.abs(validParts[0] - inputParts[0]) + Math.abs(validParts[1] - inputParts[1]);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = validSize;
        }
    }

    return bestMatch;
}

// Validar modelo de marco
function validateFrameModel(model) {
    if (!model) return "";

    // Normalizar
    model = model.trim().toUpperCase();
    model = model.replace(/\s+/g, ''); // Quitar espacios
    model = model.replace(/-/g, ''); // Quitar guiones

    // Correcciones comunes
    if (model === "A1" || model === "A-1" || model === "A 1") return "A1";
    if (model === "A2" || model === "A-2" || model === "A 2") return "A2";
    if (model === "B1" || model === "B-1" || model === "B 1") return "B1";
    if (model === "B2" || model === "B-2" || model === "B 2") return "B2";
    if (model === "C1" || model === "C-1" || model === "C 1") return "C1";
    if (model === "C2" || model === "C-2" || model === "C 2") return "C2";

    // Si coincide exactamente con uno de los permitidos
    if (VALID_FRAME_MODELS.includes(model)) {
        return model;
    }

    // Devolver el primero que coincida parcialmente
    for (const valid of VALID_FRAME_MODELS) {
        if (model.includes(valid)) {
            return valid;
        }
    }

    return ""; // No válido
}

// Validar y corregir datos generales
function validateAndCorrectData(data) {
    // Validar teléfono (solo números, 8 dígitos)
    if (data.Telefono) {
        data.Telefono = data.Telefono.replace(/\D/g, '').slice(0, 8);
    }

    // Validar precio (solo números)
    if (data["PRECIO Bs."]) {
        data["PRECIO Bs."] = data["PRECIO Bs."].replace(/\D/g, '');
    }

    // Validar fechas (formato DD-MM-YY o DD-MM-YYYY)
    if (data["Fecha de Solicitud"]) {
        data["Fecha de Solicitud"] = formatDate(data["Fecha de Solicitud"]);
    }
    if (data["Fecha Entrega"]) {
        data["Fecha Entrega"] = formatDate(data["Fecha Entrega"]);
    }

    return data;
}

// Formatear fecha
function formatDate(dateStr) {
    if (!dateStr) return "";
    
    // Eliminar caracteres no numéricos
    dateStr = dateStr.replace(/[^\d]/g, '');
    
    if (dateStr.length === 6) { // DDMMYY
        return `${dateStr.slice(0,2)}-${dateStr.slice(2,4)}-${dateStr.slice(4,6)}`;
    } else if (dateStr.length === 8) { // DDMMYYYY
        return `${dateStr.slice(0,2)}-${dateStr.slice(2,4)}-${dateStr.slice(4,8)}`;
    }
    
    return dateStr; // Devolver como está si no se puede formatear
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
    let csvContent = "text/csv;charset=utf-8,\uFEFF"; // Agrega BOM para UTF-8
    
    // Encabezados
    const headers = Object.keys(extractedDataList[0]);
    csvContent += headers.join(',') + '\n';
    
    // Datos
    extractedDataList.forEach(item => {
        const row = headers.map(header => {
            let value = item[header] || '';
            // Escapar comillas dobles y envolver en comillas si contiene comas
            if (value.toString().includes(',') || value.toString().includes('"')) {
                value = `"${value.toString().replace(/"/g, '""')}"`;
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