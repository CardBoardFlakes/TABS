let selectedType = null;
let deleteSelectedType = null;

function selectType(type) {
    console.log('Type selected:', type);
    selectedType = type;
    
    document.getElementById('factionBtn').classList.toggle('active', type === 'faction');
    document.getElementById('unitBtn').classList.toggle('active', type === 'unit');
    document.getElementById('factionFields').style.display = type === 'faction' ? 'block' : 'none';
    document.getElementById('unitFields').style.display = type === 'unit' ? 'block' : 'none';
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submit';

    document.getElementById('dataForm').reset();
    validateForm();
}

function selectDeleteType(type) {
    console.log('Delete type selected:', type);
    deleteSelectedType = type;
    
    document.getElementById('deleteFactionBtn').classList.toggle('active', type === 'faction');
    document.getElementById('deleteUnitBtn').classList.toggle('active', type === 'unit');
    document.getElementById('deleteFactionFields').style.display = type === 'faction' ? 'block' : 'none';
    document.getElementById('deleteUnitFields').style.display = type === 'unit' ? 'block' : 'none';
    
    const deleteFactionBtn = document.getElementById('deleteFactionSubmitBtn');
    const deleteUnitBtn = document.getElementById('deleteUnitSubmitBtn');
    deleteFactionBtn.disabled = true;
    deleteUnitBtn.disabled = true;
    
    if (type === 'faction') {
        loadFactionsForDelete();
    } else if (type === 'unit') {
        loadUnitsForDelete();
    }
}

function validateForm() {
    const submitBtn = document.getElementById('submitBtn');
    let isValid = false;
    
    if (selectedType === 'faction') {
        const name = document.getElementById('factionName').value.trim();
        const theme = document.getElementById('factionTheme').value.trim();
        isValid = name !== '' && theme !== '';
    } else if (selectedType === 'unit') {
        const name = document.getElementById('unitName').value.trim();
        const cost = document.getElementById('unitCost').value.trim();
        const health = document.getElementById('unitHealth').value.trim();
        const speed = document.getElementById('unitSpeed').value.trim();
        isValid = name !== '' && cost !== '' && health !== '' && speed !== '';
    }
    
    submitBtn.disabled = !isValid || !selectedType;
    
    if (submitBtn.disabled) {
        console.log('Submit button disabled. selectedType:', selectedType, 'isValid:', isValid);
    }
}

async function loadFactionsForDelete() {
    const select = document.getElementById('deleteFactionSelect');
    const deleteBtn = document.getElementById('deleteFactionSubmitBtn');
    select.innerHTML = '<option value="">Loading...</option>';
    deleteBtn.disabled = true;
    
    try {
        const response = await fetch('/api/list');
        const result = await response.json();
        if (result.success && result.factions) {
            if (result.factions.length === 0) {
                select.innerHTML = '<option value="">No factions available</option>';
                deleteBtn.disabled = true;
            } else {
                select.innerHTML = '<option value="">Select a faction...</option>' +
                    result.factions.map(f => `<option value="${f.FactionID}">${f.Name} (${f.Theme})</option>`).join('');
                select.addEventListener('change', function() {
                    deleteBtn.disabled = !this.value;
                });
            }
        } else {
            select.innerHTML = '<option value="">Error loading factions</option>';
            deleteBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error loading factions:', error);
        select.innerHTML = '<option value="">Error loading factions</option>';
        deleteBtn.disabled = true;
    }
}

async function loadUnitsForDelete() {
    const select = document.getElementById('deleteUnitSelect');
    const deleteBtn = document.getElementById('deleteUnitSubmitBtn');
    select.innerHTML = '<option value="">Loading...</option>';
    deleteBtn.disabled = true;
    
    try {
        const response = await fetch('/api/list');
        const result = await response.json();
        if (result.success && result.units) {
            if (result.units.length === 0) {
                select.innerHTML = '<option value="">No units available</option>';
                deleteBtn.disabled = true;
            } else {
                select.innerHTML = '<option value="">Select a unit...</option>' +
                    result.units.map(u => `<option value="${u.UnitID}">${u.Name} (Cost: ${u.Cost}, Health: ${u.Health}, Speed: ${u.Speed})</option>`).join('');
                select.addEventListener('change', function() {
                    deleteBtn.disabled = !this.value;
                });
            }
        } else {
            select.innerHTML = '<option value="">Error loading units</option>';
            deleteBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error loading units:', error);
        select.innerHTML = '<option value="">Error loading units</option>';
        deleteBtn.disabled = true;
    }
}

function handleDelete(type) {
    if (type === 'faction') {
        const factionId = document.getElementById('deleteFactionSelect').value;
        if (!factionId) {
            showPopup('error', 'Error', 'Please select a faction to delete.');
            return;
        }
        
        const factionName = document.getElementById('deleteFactionSelect').options[document.getElementById('deleteFactionSelect').selectedIndex].text.split(' (')[0];
        if (!confirm(`Are you sure you want to delete the faction "${factionName}"? This will also remove all unit assignments for this faction.`)) {
            return;
        }
        
        const deleteBtn = document.getElementById('deleteFactionSubmitBtn');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';
        
        fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'faction', id: parseInt(factionId, 10) })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showPopup('success', 'Success!', result.message);
                loadFactionsForDelete();
                document.getElementById('deleteFactionSelect').value = '';
            } else {
                showPopup('error', 'Error', result.message || 'Failed to delete faction.');
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete Faction';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showPopup('error', 'Error', 'Failed to connect to the server. Please try again.');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Faction';
        });
    } else if (type === 'unit') {
        const unitId = document.getElementById('deleteUnitSelect').value;
        if (!unitId) {
            showPopup('error', 'Error', 'Please select a unit to delete.');
            return;
        }
        
        const unitName = document.getElementById('deleteUnitSelect').options[document.getElementById('deleteUnitSelect').selectedIndex].text.split(' (')[0];
        if (!confirm(`Are you sure you want to delete the unit "${unitName}"? This will also remove all faction assignments for this unit.`)) {
            return;
        }
        
        const deleteBtn = document.getElementById('deleteUnitSubmitBtn');
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';
        
        fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'unit', id: parseInt(unitId, 10) })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showPopup('success', 'Success!', result.message);
                loadUnitsForDelete();
                document.getElementById('deleteUnitSelect').value = '';
            } else {
                showPopup('error', 'Error', result.message || 'Failed to delete unit.');
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete Unit';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showPopup('error', 'Error', 'Failed to connect to the server. Please try again.');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Unit';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('factionBtn').addEventListener('click', function() {
        selectType('faction');
    });
    
    document.getElementById('unitBtn').addEventListener('click', function() {
        selectType('unit');
    });
    
    document.getElementById('deleteFactionBtn').addEventListener('click', function() {
        selectDeleteType('faction');
    });
    
    document.getElementById('deleteUnitBtn').addEventListener('click', function() {
        selectDeleteType('unit');
    });
    
    document.getElementById('dataForm').addEventListener('submit', handleSubmit);
    
    document.getElementById('submitBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (!this.disabled) 
        {
            document.getElementById('dataForm').dispatchEvent(new Event('submit'));
        } 
        
        else 
        {
            console.log('Cant submit now. Please fill in all required fields.');
            showPopup('error', 'Validation Error', 'Please fill in all required fields before submitting.');
        }
    });
    
    document.getElementById('deleteFactionSubmitBtn').addEventListener('click', function() {
        handleDelete('faction');
    });
    
    document.getElementById('deleteUnitSubmitBtn').addEventListener('click', function() {
        handleDelete('unit');
    });
    
    document.getElementById('popupOverlay').addEventListener('click', closePopup);
    document.getElementById('popupClose').addEventListener('click', closePopup);
    document.getElementById('factionName').addEventListener('input', validateForm);
    document.getElementById('factionTheme').addEventListener('input', validateForm);
    document.getElementById('unitName').addEventListener('input', validateForm);
    document.getElementById('unitCost').addEventListener('input', validateForm);
    document.getElementById('unitHealth').addEventListener('input', validateForm);
    document.getElementById('unitSpeed').addEventListener('input', validateForm);
});

function handleSubmit(event) {
    event.preventDefault();
    console.log('Form submitted!');
    
    if (!selectedType) {
        showPopup('error', 'Error', 'Please select if you want to create a Faction or Unit.');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    const formData = new FormData(document.getElementById('dataForm'));
    const data = {
        type: selectedType
    };
    
    if (selectedType === 'faction') {
        data.name = document.getElementById('factionName').value.trim();
        data.theme = document.getElementById('factionTheme').value.trim();
    } else if (selectedType === 'unit') {
        data.name = document.getElementById('unitName').value.trim();
        data.cost = document.getElementById('unitCost').value.trim();
        data.health = document.getElementById('unitHealth').value.trim();
        data.speed = document.getElementById('unitSpeed').value.trim();
    }
    
    console.log('Sending data:', data);
    
    fetch('/api/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response received:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('Result:', result);
        if (result.success) {
            showPopup('success', 'Success!', result.message);
            document.getElementById('dataForm').reset();
            selectedType = null;
            document.getElementById('factionBtn').classList.remove('active');
            document.getElementById('unitBtn').classList.remove('active');
            document.getElementById('factionFields').style.display = 'none';
            document.getElementById('unitFields').style.display = 'none';
            validateForm();
        } else {
            showPopup('error', 'Error', result.message || 'An error occurred while saving the data.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            validateForm();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showPopup('error', 'Error', 'Failed to connect to the server. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        validateForm();
    });
}

function showPopup(type, title, message) {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('popupOverlay');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    
    popup.className = `popup ${type}`;
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    
    popup.classList.add('show');
    overlay.classList.add('show');
}

function closePopup() {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('popupOverlay');
    
    popup.classList.remove('show');
    overlay.classList.remove('show');
}

