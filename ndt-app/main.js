const API_URL = 'https://awswelding.runasp.net';

let inspectors = []; // Renamed from certificates
let certificatesList = []; // NEW: for individual certificates
let courses = [];
let isEditingInspector = false;
let isEditingCertificate = false;
let isEditingCourse = false;
let editingInspectorId = null;
let editingCertificateNumber = null;
let editingCourseId = null;
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
    fetchInspectors();
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

// ==================== INSPECTORS TAB ====================

// Fetch all inspectors
function fetchInspectors() {
    fetch(`${API_URL}/api/Inspectors/all`, {
        headers: {
            'username': username,
            'password': password
        }
    })
        .then(response => response.json())
        .then(data => {
            inspectors = data;
            renderInspectorsTable();
        })
        .catch(error => console.error('Error:', error));
}

// Render inspectors table
function renderInspectorsTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Inspector Number</th>
                    <th>Full Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${inspectors.map(inspector => `
                    <tr>
                        <td>${inspector.inspectorNumber}</td>
                        <td>${inspector.fullName}</td>
                        <td class="action-buttons">
                            <button class="edit-btn" onclick="editInspector(${inspector.inspectorNumber})">Edit</button>
                            <button class="delete-btn" onclick="deleteInspector(${inspector.inspectorNumber})">Delete</button>
                            <button class="details-btn" onclick="viewInspectorCertificates(${inspector.inspectorNumber})">Certificates</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('certificateTable').innerHTML = tableHtml;
}

// Add new inspector
document.getElementById('addCertificateBtn').addEventListener('click', () => {
    isEditingInspector = false;
    editingInspectorId = null;
    document.getElementById('formTitle').textContent = 'Add New Inspector';
    document.getElementById('certificateForm').reset();
    document.getElementById('certificateModal').style.display = 'block';
});

// Handle inspector form submission
document.getElementById('certificateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('sbmtbtn').style.display = 'none';

    const formData = {
        inspectorNumber: parseInt(document.getElementById('inspectorNumber').value),
        fullName: document.getElementById('fullName').value
    };

    const url = isEditingInspector
        ? `${API_URL}/api/Inspectors/${editingInspectorId}`
        : `${API_URL}/api/Inspectors`;
    const method = isEditingInspector ? 'PUT' : 'POST';

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
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            fetchInspectors();
            document.getElementById('certificateModal').style.display = 'none';
            document.getElementById('sbmtbtn').style.display = 'block';
            showMessage(isEditingInspector ? 'Inspector updated successfully!' : 'Inspector added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('sbmtbtn').style.display = 'block';
            showMessage('An error occurred. Please try again.', true);
        });
});

// Edit inspector
function editInspector(inspectorNumber) {
    isEditingInspector = true;
    const inspector = inspectors.find(insp => insp.inspectorNumber === inspectorNumber);
    editingInspectorId = inspectorNumber;

    document.getElementById('formTitle').textContent = 'Edit Inspector';
    document.getElementById('inspectorNumber').value = inspector.inspectorNumber;
    document.getElementById('fullName').value = inspector.fullName;

    document.getElementById('certificateModal').style.display = 'block';
}

// Delete inspector
function deleteInspector(inspectorNumber) {
    if (confirm('Are you sure you want to delete this inspector?')) {
        fetch(`${API_URL}/api/Inspectors/${inspectorNumber}`, {
            method: 'DELETE',
            headers: {
                'username': username,
                'password': password
            }
        })
            .then(response => {
                if (response.ok) {
                    fetchInspectors();
                    showMessage('Inspector deleted successfully!');
                } else {
                    throw new Error('Failed to delete inspector');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred while deleting the inspector.', true);
            });
    }
}

// View inspector certificates
function viewInspectorCertificates(inspectorNumber) {
    // Switch to certificates tab and filter by inspector
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    document.querySelector('[data-tab="certList"]').classList.add('active');
    document.getElementById('certListTab').classList.add('active');

    fetchCertificates(inspectorNumber);
}

// ==================== CERTIFICATES TAB ====================

// Fetch certificates (optionally filtered by inspector)
function fetchCertificates(inspectorNumber = null) {
    const url = inspectorNumber
        ? `${API_URL}/api/Certificates/inspector/${inspectorNumber}`
        : `${API_URL}/api/Certificates/all`;

    fetch(url, {
        headers: {
            'username': username,
            'password': password
        }
    })
        .then(response => response.json())
        .then(data => {
            certificatesList = data;
            renderCertificatesTable();
        })
        .catch(error => console.error('Error:', error));
}

// Render certificates table
function renderCertificatesTable() {
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'No expiry';

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Certificate Number</th>
                    <th>Inspector Number</th>
                    <th>Certificate Name</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${certificatesList.map(cert => `
                    <tr>
                        <td>${cert.certificateNumber}</td>
                        <td>${cert.inspectorNumber}</td>
                        <td>${cert.certificateName}</td>
                        <td>${formatDate(cert.expiryDate)}</td>
                        <td class="action-buttons">
                            <button class="edit-btn" onclick="editCertificate('${cert.certificateNumber}')">Edit</button>
                            <button class="delete-btn" onclick="deleteCertificate('${cert.certificateNumber}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('certificateListTable').innerHTML = tableHtml;
}

// Add new certificate
document.getElementById('addNewCertificateBtn').addEventListener('click', () => {
    isEditingCertificate = false;
    editingCertificateNumber = null;
    document.getElementById('newCertFormTitle').textContent = 'Add New Certificate';
    document.getElementById('newCertificateForm').reset();
    document.getElementById('newCertificateModal').style.display = 'block';
});

// Handle certificate form submission
document.getElementById('newCertificateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('certSbmtBtn').style.display = 'none';

    const formData = {
        certificateNumber: document.getElementById('certNumber').value,
        inspectorNumber: parseInt(document.getElementById('certInspectorNumber').value),
        certificateName: document.getElementById('certName').value,
        expiryDate: document.getElementById('certExpiryDate').value
    };

    const url = isEditingCertificate
        ? `${API_URL}/api/Certificates/${editingCertificateNumber}`
        : `${API_URL}/api/Certificates`;
    const method = isEditingCertificate ? 'PUT' : 'POST';

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
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            fetchCertificates();
            document.getElementById('newCertificateModal').style.display = 'none';
            document.getElementById('certSbmtBtn').style.display = 'block';
            showMessage(isEditingCertificate ? 'Certificate updated successfully!' : 'Certificate added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('certSbmtBtn').style.display = 'block';
            showMessage('An error occurred. Please try again.', true);
        });
});

// Edit certificate
function editCertificate(certificateNumber) {
    isEditingCertificate = true;
    const cert = certificatesList.find(c => c.certificateNumber === certificateNumber);
    editingCertificateNumber = certificateNumber;

    document.getElementById('newCertFormTitle').textContent = 'Edit Certificate';
    document.getElementById('certNumber').value = cert.certificateNumber;
    document.getElementById('certInspectorNumber').value = cert.inspectorNumber;
    document.getElementById('certName').value = cert.certificateName;
    document.getElementById('certExpiryDate').value = cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '';

    document.getElementById('newCertificateModal').style.display = 'block';
}

// Delete certificate
function deleteCertificate(certificateNumber) {
    if (confirm('Are you sure you want to delete this certificate?')) {
        fetch(`${API_URL}/api/Certificates/${certificateNumber}`, {
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

// ==================== TAB NAVIGATION ====================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        // Add active class to clicked button and corresponding tab
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');

        // Fetch data for the selected tab
        if (btn.dataset.tab === 'courses') {
            fetchCourses();
        } else if (btn.dataset.tab === 'certList') {
            fetchCertificates();
        }
    });
});

// ==================== COURSES TAB (unchanged) ====================

// Fetch Courses
function fetchCourses() {
    fetch(`${API_URL}/api/Certificate/all`, {
        headers: {
            'username': username,
            'password': password
        }
    })
        .then(response => response.json())
        .then(data => {
            courses = data;
            renderCoursesTable();
        })
        .catch(error => console.error('Error:', error));
}

// Render Courses Table
function renderCoursesTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Certificate ID</th>
                    <th>Name</th>
                    <th>Course Title</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${courses.map(course => `
                    <tr>
                        <td>${course.certificateID}</td>
                        <td>${course.name || 'N/A'}</td>
                        <td>${course.courseTitle || 'N/A'}</td>
                        <td class="action-buttons">
                            <button class="edit-btn" onclick="editCourse(${course.certificateID})">Edit</button>
                            <button class="delete-btn" onclick="deleteCourse(${course.certificateID})">Delete</button>
                            <button class="details-btn" onclick="showCourseDetails(${course.certificateID})">Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('courseTable').innerHTML = tableHtml;
}

// Add New Course Button
document.getElementById('addCourseBtn').addEventListener('click', () => {
    isEditingCourse = false;
    editingCourseId = null;
    document.getElementById('courseFormTitle').textContent = 'Add New Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseModal').style.display = 'block';
});

// Course Form Submission
document.getElementById('courseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('courseSbmtBtn').style.display = 'none';

    const formData = {
        certificateID: parseInt(document.getElementById('certificateID').value),
        name: document.getElementById('courseName').value,
        courseTitle: document.getElementById('courseTitle').value
    };

    const url = isEditingCourse
        ? `${API_URL}/api/Certificate/${editingCourseId}`
        : `${API_URL}/api/Certificate`;
    const method = isEditingCourse ? 'PUT' : 'POST';

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
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            fetchCourses();
            document.getElementById('courseModal').style.display = 'none';
            document.getElementById('courseSbmtBtn').style.display = 'block';
            showMessage(isEditingCourse ? 'Course updated successfully!' : 'Course added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('courseSbmtBtn').style.display = 'block';
            showMessage('An error occurred. Please try again.', true);
        });
});

// Edit Course
function editCourse(id) {
    isEditingCourse = true;
    editingCourseId = id;
    const course = courses.find(c => c.certificateID === id);

    document.getElementById('courseFormTitle').textContent = 'Edit Course';
    document.getElementById('certificateID').value = course.certificateID;
    document.getElementById('courseName').value = course.name || '';
    document.getElementById('courseTitle').value = course.courseTitle || '';

    document.getElementById('courseModal').style.display = 'block';
}

// Delete Course
function deleteCourse(id) {
    if (confirm('Are you sure you want to delete this course?')) {
        fetch(`${API_URL}/api/Certificate/${id}`, {
            method: 'DELETE',
            headers: {
                'username': username,
                'password': password
            }
        })
            .then(response => {
                if (response.ok) {
                    fetchCourses();
                    showMessage('Course deleted successfully!');
                } else {
                    throw new Error('Failed to delete course');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred while deleting the course.', true);
            });
    }
}

// Show Course Details
function showCourseDetails(id) {
    const course = courses.find(c => c.certificateID === id);

    const detailsHtml = `
        <p><strong>Certificate ID:</strong> ${course.certificateID}</p>
        <p><strong>Name:</strong> ${course.name || 'N/A'}</p>
        <p><strong>Course Title:</strong> ${course.courseTitle || 'N/A'}</p>
    `;
    document.getElementById('courseDetails').innerHTML = detailsHtml;
    document.getElementById('courseDetailsModal').style.display = 'block';
}

// ==================== UTILITY FUNCTIONS ====================

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

// Initial check for login status
checkLoginStatus();