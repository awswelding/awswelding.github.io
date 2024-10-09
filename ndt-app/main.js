const API_URL = 'https://abdoabudeiff.somee.com'; // Replace with your actual API URL

let certificates = [];
let isEditing = false;
let editingId = null;
let username, password;

// Show login or dashboard based on session storage
function checkLoginStatus() {
    username = sessionStorage.getItem('username');
    password = sessionStorage.getItem('password');
    if (username && password) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    fetchCertificates();
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;

    fetch(`${API_URL}/api/Account/Login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            UserName: username,
            Passsword: password
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Login successful.") {
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('password', password);
                showDashboard();
            } else {
                document.getElementById('errorMessage').textContent = data.message;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            document.getElementById('errorMessage').textContent = 'An error occurred. Please try again.';
        });
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
    showLogin();
});

// Fetch all certificates
function fetchCertificates() {
    fetch(`${API_URL}/api/Items/all`, {
        headers: {
            'username': username,
            'password': password
        }
    })
        .then(response => response.json())
        .then(data => {
            certificates = data;
            renderTable();
        })
        .catch(error => console.error('Error:', error));
}

// Render certificates table
function renderTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Inspector Number</th>
                    <th>Roll Number</th>
                    <th>Inspector Name</th>
                    <th>Father Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${certificates.map(cert => `
                    <tr>
                        <td>${cert.inspectorNumber}</td>
                        <td>${cert.roll_number}</td>
                        <td>${cert.inspectorName}</td>
                        <td>${cert.fatherName}</td>
                        <td class="action-buttons">
                            <button class="edit-btn" onclick="editCertificate(${cert.inspectorNumber})">Edit</button>
                            <button class="delete-btn" onclick="deleteCertificate(${cert.inspectorNumber})">Delete</button>
                            <button class="details-btn" onclick="showDetails(${cert.inspectorNumber})">Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('certificateTable').innerHTML = tableHtml;
}

// Add new certificate
document.getElementById('addCertificateBtn').addEventListener('click', () => {
    isEditing = false;
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add New Certificate';
    document.getElementById('certificateForm').reset();
    document.getElementById('certificateModal').style.display = 'block';
});

// Handle form submission
document.getElementById('certificateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        inspectorNumber: parseInt(document.getElementById('inspectorNumber').value),
        roll_number: parseInt(document.getElementById('rollNumber').value),
        inspectorName: document.getElementById('inspectorName').value,
        fatherName: document.getElementById('fatherName').value,
        radiographic_testing_level_II: document.getElementById('radiographicTesting').checked,
        ultrasonic_testing_level_II: document.getElementById('ultrasonicTesting').checked,
        visual_testing_level_II: document.getElementById('visualTesting').checked,
        liquid_penetrant_testing_level_II: document.getElementById('liquidPenetrantTesting').checked,
        magnetic_particle_testing_level_II: document.getElementById('magneticParticleTesting').checked
    };

    const url = isEditing ? `${API_URL}/api/Items/${editingId}` : `${API_URL}/api/Items`;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'username': username,
            'password': password
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (!response.ok) { // If the status is not 200-299, throw an error
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            fetchCertificates();
            document.getElementById('certificateModal').style.display = 'none';
            showMessage(isEditing ? 'Certificate updated successfully!' : 'Certificate added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('certificateModal').style.display = 'none';
            showMessage('An error occurred. Please try again.', true);
        });

});

// Edit certificate

function editCertificate(id) {
    isEditing = true;
    const certificate = certificates.find(cert => cert.inspectorNumber === id);
    editingId = objectIdToString(certificate.id);


    document.getElementById('formTitle').textContent = 'Edit Certificate';
    document.getElementById('inspectorNumber').value = certificate.inspectorNumber;
    document.getElementById('rollNumber').value = certificate.roll_number;
    document.getElementById('inspectorName').value = certificate.inspectorName;
    document.getElementById('fatherName').value = certificate.fatherName;
    document.getElementById('radiographicTesting').checked = certificate.radiographic_testing_level_II;
    document.getElementById('ultrasonicTesting').checked = certificate.ultrasonic_testing_level_II;
    document.getElementById('visualTesting').checked = certificate.visual_testing_level_II;
    document.getElementById('liquidPenetrantTesting').checked = certificate.liquid_penetrant_testing_level_II;
    document.getElementById('magneticParticleTesting').checked = certificate.magnetic_particle_testing_level_II;
    document.getElementById('certificateModal').style.display = 'block';
}

// Delete certificate
function deleteCertificate(id) {

    var delid = objectIdToString(certificates.find(cert => cert.inspectorNumber === id).id)

    if (confirm('Are you sure you want to delete this certificate?')) {
        fetch(`${API_URL}/api/Items/${delid}`, {
            method: 'DELETE',
            headers: {
                'username': username,
                'password': password
            }
        })
            .then(response => {
                if (response.ok) {
                    fetchCertificates();
                    showMessage('Certificate deleted successfully!');
                } else {
                    throw new Error('Failed to delete certificate');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred while deleting the certificate.', true);
            });
    }
}

// Show certificate details
function showDetails(id) {
    const certificate = certificates.find(cert => cert.inspectorNumber === id);

    const detailsHtml = `
        <p><strong>Inspector Number:</strong> ${certificate.inspectorNumber}</p>
        <p><strong>Roll Number:</strong> ${certificate.roll_number}</p>
        <p><strong>Inspector Name:</strong> ${certificate.inspectorName}</p>
        <p><strong>Father Name:</strong> ${certificate.fatherName}</p>
        <p><strong>Radiographic Testing Level II:</strong> ${certificate.radiographic_testing_level_II ? 'Yes' : 'No'}</p>
        <p><strong>Ultrasonic Testing Level II:</strong> ${certificate.ultrasonic_testing_level_II ? 'Yes' : 'No'}</p>
        <p><strong>Visual Testing Level II:</strong> ${certificate.visual_testing_level_II ? 'Yes' : 'No'}</p>
        <p><strong>Liquid Penetrant Testing Level II:</strong> ${certificate.liquid_penetrant_testing_level_II ? 'Yes' : 'No'}</p>
        <p><strong>Magnetic Particle Testing Level II:</strong> ${certificate.magnetic_particle_testing_level_II ? 'Yes' : 'No'}</p>
    `;
    document.getElementById('certificateDetails').innerHTML = detailsHtml;
    document.getElementById('detailsModal').style.display = 'block';
}

// Show message function
function showMessage(message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = isError ? 'error-message' : 'success-message';
    document.querySelector('.container').insertAdjacentElement('afterbegin', messageElement);
    setTimeout(() => messageElement.remove(), 3000);
}

// Modal control
const modals = document.getElementsByClassName('modal');
const closeButtons = document.getElementsByClassName('close');

for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].onclick = function () {
        modals[i].style.display = 'none';
    }
}

window.onclick = function (event) {
    for (let i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}


function objectIdToString(obj) {
    // Ensure all parts are available
    if (!obj.timestamp || !obj.machine || !obj.pid || !obj.increment) {
        throw new Error('Invalid ObjectId-like object');
    }

    // Convert to hexadecimal strings and pad with zeros
    const timestamp = obj.timestamp.toString(16).padStart(8, '0');
    const machine = obj.machine.toString(16).padStart(6, '0');
    const pid = obj.pid.toString(16).padStart(4, '0');
    const increment = obj.increment.toString(16).padStart(6, '0');

    // Concatenate all parts
    return timestamp + machine + pid + increment;
}

// Initial check for login status
checkLoginStatus();