// Pelarasan System JavaScript
let pelarasanData = [];
let currentEditId = null;
let inventoriCounter = 0;

// API Base URL - same pattern as kewangan
const API_BASE_URL = 'http://localhost:3002/api/pelarasan';

// Show different sections
function showSection(section, clickedElement) {
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('[id$="-section"]').forEach(section => section.classList.add('hidden'));
    
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    document.getElementById(section + '-section').classList.remove('hidden');
    
    if (section === 'senarai') {
        loadSenarai();
    } else if (section === 'selesai') {
        loadSelesai();
    }
}

// Show inventori details when inventori is selected
function showInventoriDetails() {
    const inventoriSelect = document.getElementById('inventoriAsal');
    const detailsDiv = document.getElementById('inventoriDetails');
    
    if (inventoriSelect.value) {
        detailsDiv.classList.remove('hidden');
        if (document.getElementById('inventoriItems').children.length === 0) {
            addInventoriItem();
        }
    } else {
        detailsDiv.classList.add('hidden');
        document.getElementById('inventoriItems').innerHTML = '';
        inventoriCounter = 0;
    }
}

// Add inventori item
function addInventoriItem() {
    inventoriCounter++;
    const container = document.getElementById('inventoriItems');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventori-item';
    itemDiv.id = 'inventori-item-' + inventoriCounter;
    
    itemDiv.innerHTML = `
        <div class="form-col">
            <label>a. BILANGAN</label>
            <input type="number" name="bilangan[]" step="0.01" min="0" required>
        </div>
        <div class="form-col">
            <label>b. KADAR ASAL (RM)</label>
            <div class="kadar-input">
                <input type="number" name="kadarAsal[]" step="0.01" min="0" required>
                <span class="unit-label">/m</span>
            </div>
        </div>
        ${inventoriCounter > 1 ? '<button type="button" class="remove-btn" onclick="removeInventoriItem(' + inventoriCounter + ')">Buang</button>' : ''}
    `;
    
    container.appendChild(itemDiv);
}

// Remove inventori item
function removeInventoriItem(id) {
    const item = document.getElementById('inventori-item-' + id);
    if (item) {
        item.remove();
    }
}

// Toggle sebab lain text area
function toggleSebabLain() {
    const select = document.getElementById('sebabPemotongan');
    const textArea = document.getElementById('sebabLainText');
    
    if (select.value === 'Lain-Lain') {
        textArea.classList.remove('hidden');
        textArea.required = true;
    } else {
        textArea.classList.add('hidden');
        textArea.required = false;
        textArea.value = '';
    }
}

// Calculate total bilangan from inventori items
function calculateTotalBilangan() {
    const bilanganInputs = document.querySelectorAll('input[name="bilangan[]"]');
    const kadarInputs = document.querySelectorAll('input[name="kadarAsal[]"]');
    let total = 0;
    
    for (let i = 0; i < bilanganInputs.length; i++) {
        const bilangan = parseFloat(bilanganInputs[i].value) || 0;
        const kadar = parseFloat(kadarInputs[i].value) || 0;
        total += bilangan * kadar;
    }
    
    return total.toFixed(2);
}

// Get inventori details as array
function getInventoriDetails() {
    const bilanganInputs = document.querySelectorAll('input[name="bilangan[]"]');
    const kadarInputs = document.querySelectorAll('input[name="kadarAsal[]"]');
    const details = [];
    
    for (let i = 0; i < bilanganInputs.length; i++) {
        details.push({
            bilangan: parseFloat(bilanganInputs[i].value) || 0,
            kadarAsal: parseFloat(kadarInputs[i].value) || 0
        });
    }
    
    return details;
}

// Save pelarasan to database
async function savePelarasan(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Pelarasan berjaya didaftarkan!');
            return true;
        } else {
            alert('Ralat: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Error saving pelarasan:', error);
        alert('Ralat sambungan ke server');
        return false;
    }
}

// Load pelarasan data from database
async function loadPelarasanData(status = null) {
    try {
        let url = `${API_BASE_URL}/get`;
        if (status) {
            url += `?status=${status}`;
        }

        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            console.error('Error loading data:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Error loading pelarasan data:', error);
        return [];
    }
}

// Update pelarasan in database
async function updatePelarasanInDB(id, formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Pelarasan berjaya dikemaskini!');
            return true;
        } else {
            alert('Ralat: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Error updating pelarasan:', error);
        alert('Ralat sambungan ke server');
        return false;
    }
}

// Mark pelarasan as completed in database
async function completePelarasanInDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/complete/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Pelarasan telah ditandakan sebagai selesai!');
            return true;
        } else {
            alert('Ralat: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Error completing pelarasan:', error);
        alert('Ralat sambungan ke server');
        return false;
    }
}

// Delete pelarasan from database
async function deletePelarasanFromDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Pelarasan berjaya dipadam!');
            return true;
        } else {
            alert('Ralat: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Error deleting pelarasan:', error);
        alert('Ralat sambungan ke server');
        return false;
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pelarasanForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const inventoriDetails = getInventoriDetails();
            const totalBilangan = calculateTotalBilangan();
            
            const data = {
                namaAlamat: formData.get('namaAlamat'),
                perkhidmatan: formData.get('perkhidmatan'),
                inventoriAsal: formData.get('inventoriAsal'),
                inventoriDetails: inventoriDetails,
                totalBilangan: totalBilangan,
                tarikhCadangan: formData.get('tarikhCadangan'),
                jumlahBulan: formData.get('jumlahBulan'),
                jumlahCadangan: formData.get('jumlahCadangan'),
                sebabPemotongan: formData.get('sebabPemotongan'),
                sebabLainText: formData.get('sebabLainText'),
                keputusanMesyuarat: formData.get('keputusanMesyuarat')
            };
            
            const success = await savePelarasan(data);
            if (success) {
                this.reset();
                document.getElementById('inventoriDetails').classList.add('hidden');
                document.getElementById('inventoriItems').innerHTML = '';
                inventoriCounter = 0;
            }
        });
    }
    
    // Add event listeners for sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.textContent.toLowerCase().includes('daftar') ? 'daftar' :
                          this.textContent.toLowerCase().includes('senarai') ? 'senarai' : 'selesai';
            showSection(section, this);
        });
    });
});

// Load senarai pelarasan - Updated with Keputusan Mesyuarat column
async function loadSenarai() {
    const tbody = document.querySelector('#senarai-table tbody');
    tbody.innerHTML = '<tr><td colspan="10">Memuat data...</td></tr>';
    
    const pendingData = await loadPelarasanData('Pending');
    tbody.innerHTML = '';
    
    pendingData.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.nama_alamat ? item.nama_alamat.substring(0, 30) + '...' : ''}</td>
            <td>${item.perkhidmatan || ''}</td>
            <td>${item.inventori_asal || ''}</td>
            <td>${item.total_bilangan || 0}</td>
            <td>${item.tarikh_cadangan || ''}</td>
            <td>RM ${item.jumlah_cadangan || 0}</td>
            <td>${item.keputusan_mesyuarat ? item.keputusan_mesyuarat.substring(0, 30) + '...' : ''}</td>
            <td><span class="status-pending">PENDING</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editPelarasan(${item.id})">Edit</button>
                </div>
            </td>
        `;
    });
}

// Load selesai pelarasan - Updated with Keputusan Mesyuarat column
async function loadSelesai() {
    const tbody = document.querySelector('#selesai-table tbody');
    tbody.innerHTML = '<tr><td colspan="9">Memuat data...</td></tr>';
    
    const completedData = await loadPelarasanData('Completed');
    tbody.innerHTML = '';
    
    completedData.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.nama_alamat ? item.nama_alamat.substring(0, 30) + '...' : ''}</td>
            <td>${item.perkhidmatan || ''}</td>
            <td>${item.inventori_asal || ''}</td>
            <td>${item.total_bilangan || 0}</td>
            <td>${item.tarikh_cadangan || ''}</td>
            <td>RM ${item.jumlah_cadangan || 0}</td>
            <td>${item.keputusan_mesyuarat ? item.keputusan_mesyuarat.substring(0, 30) + '...' : ''}</td>
            <td>${item.tarikh_selesai || ''}</td>
        `;
    });
}

// Edit pelarasan
async function editPelarasan(id) {
    const allData = await loadPelarasanData();
    const item = allData.find(p => p.id === id);
    if (!item) return;
    
    currentEditId = id;
    
    const editForm = document.getElementById('editForm');
    editForm.innerHTML = `
        <div class="form-group">
            <label>Nama/Alamat Bangunan:</label>
            <textarea id="editNamaAlamat">${item.nama_alamat || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-col">
                <label>Perkhidmatan:</label>
                <input type="text" id="editPerkhidmatan" value="${item.perkhidmatan || ''}" readonly>
            </div>
            <div class="form-col">
                <label>Inventori Asal:</label>
                <input type="text" id="editInventoriAsal" value="${item.inventori_asal || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-col">
                <label>Tarikh Cadangan:</label>
                <input type="date" id="editTarikhCadangan" value="${item.tarikh_cadangan || ''}">
            </div>
            <div class="form-col">
                <label>Jumlah Bulan:</label>
                <input type="number" id="editJumlahBulan" value="${item.jumlah_bulan || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Jumlah (RM) Cadangan:</label>
            <input type="number" id="editJumlahCadangan" step="0.01" value="${item.jumlah_cadangan || ''}">
        </div>
        <div class="form-group">
            <label>Keputusan Mesyuarat:</label>
            <textarea id="editKeputusanMesyuarat">${item.keputusan_mesyuarat || ''}</textarea>
        </div>
    `;
    
    document.getElementById('editModal').style.display = 'block';
}

// Update pelarasan
async function updatePelarasan() {
    if (!currentEditId) return;
    
    const formData = {
        namaAlamat: document.getElementById('editNamaAlamat').value,
        tarikhCadangan: document.getElementById('editTarikhCadangan').value,
        jumlahBulan: document.getElementById('editJumlahBulan').value,
        jumlahCadangan: document.getElementById('editJumlahCadangan').value,
        keputusanMesyuarat: document.getElementById('editKeputusanMesyuarat').value
    };
    
    const success = await updatePelarasanInDB(currentEditId, formData);
    if (success) {
        closeModal();
        loadSenarai();
    }
}

// Mark as completed
async function markCompleted() {
    if (!currentEditId) return;
    
    const success = await completePelarasanInDB(currentEditId);
    if (success) {
        closeModal();
        loadSenarai();
    }
}

// Delete pelarasan
async function deletePelarasan() {
    if (!currentEditId) return;
    
    if (confirm('Adakah anda pasti ingin memadam pelarasan ini?')) {
        const success = await deletePelarasanFromDB(currentEditId);
        if (success) {
            closeModal();
            loadSenarai();
        }
    }
}

// Close modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize page - Fixed the event issue
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with daftar section
    document.querySelector('.sidebar-item').classList.add('active');
    document.getElementById('daftar-section').classList.remove('hidden');
});
