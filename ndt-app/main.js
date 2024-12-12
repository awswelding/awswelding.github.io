const API_URL = 'https://awswelding.runasp.net'; // Replace with your actual API URL

let certificates = [];
let courses = [];
let isEditingCertificate = false;
let isEditingCourse = false;
let editingCertificateId = null;
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
    setupCertificationCheckboxes();
});

function setupCertificationCheckboxes() {
    const certifications = [
        'radiographicTesting',
        'ultrasonicTesting',
        'ultrasonicPhasedArray',
        'visualTesting',
        'liquidPenetrantTesting',
        'magneticParticleTesting'
    ];

    certifications.forEach(cert => {
        const checkbox = document.getElementById(cert);
        const expDate = document.getElementById(`${cert}Exp`);

        checkbox.addEventListener('change', () => {
            expDate.disabled = !checkbox.checked;
            if (!checkbox.checked) {
                expDate.value = '';
            }
        });

        // Initial state
        expDate.disabled = !checkbox.checked;
    });
}

// Handle form submission
document.getElementById('certificateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('sbmtbtn').style.display = 'none';

    const formData = {
        inspectorNumber: parseInt(document.getElementById('inspectorNumber').value),
        roll_number: parseInt(document.getElementById('rollNumber').value),
        inspectorName: document.getElementById('inspectorName').value,
        fatherName: document.getElementById('fatherName').value,
        radiographic_testing_level_II: document.getElementById('radiographicTesting').checked,
        radiographic_testing_level_II_ExpDate: document.getElementById('radiographicTestingExp').value || null,
        ultrasonic_testing_level_II: document.getElementById('ultrasonicTesting').checked,
        ultrasonic_testing_level_II_ExpDate: document.getElementById('ultrasonicTestingExp').value || null,
        ultrasonic_Phased_Array_Level_II: document.getElementById('ultrasonicPhasedArray').checked,
        ultrasonic_Phased_Array_Level_II_ExpDate: document.getElementById('ultrasonicPhasedArrayExp').value || null,
        visual_testing_level_II: document.getElementById('visualTesting').checked,
        visual_testing_level_II_ExpDate: document.getElementById('visualTestingExp').value || null,
        liquid_penetrant_testing_level_II: document.getElementById('liquidPenetrantTesting').checked,
        liquid_penetrant_testing_level_II_ExpDate: document.getElementById('liquidPenetrantTestingExp').value || null,
        magnetic_particle_testing_level_II: document.getElementById('magneticParticleTesting').checked,
        magnetic_particle_testing_level_II_ExpDate: document.getElementById('magneticParticleTestingExp').value || null
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
            document.getElementById('sbmtbtn').style.display = 'block';
            showMessage(isEditing ? 'Certificate updated successfully!' : 'Certificate added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('sbmtbtn').style.display = 'block';
            showMessage('An error occurred. Please try again.', true);
        });

});

// Edit certificate

function editCertificate(id) {
    isEditing = true;
    const certificate = certificates.find(cert => cert.inspectorNumber === id);
    editingId = id;

    document.getElementById('formTitle').textContent = 'Edit Certificate';
    document.getElementById('inspectorNumber').value = certificate.inspectorNumber;
    document.getElementById('rollNumber').value = certificate.roll_number;
    document.getElementById('inspectorName').value = certificate.inspectorName;
    document.getElementById('fatherName').value = certificate.fatherName;

    // Set certification checkboxes and exp dates
    document.getElementById('radiographicTesting').checked = certificate.radiographic_testing_level_II;
    document.getElementById('radiographicTestingExp').value = certificate.radiographic_testing_level_II_ExpDate?.split('T')[0] || '';

    document.getElementById('ultrasonicTesting').checked = certificate.ultrasonic_testing_level_II;
    document.getElementById('ultrasonicTestingExp').value = certificate.ultrasonic_testing_level_II_ExpDate?.split('T')[0] || '';

    document.getElementById('visualTesting').checked = certificate.visual_testing_level_II;
    document.getElementById('visualTestingExp').value = certificate.visual_testing_level_II_ExpDate?.split('T')[0] || '';

    document.getElementById('liquidPenetrantTesting').checked = certificate.liquid_penetrant_testing_level_II;
    document.getElementById('liquidPenetrantTestingExp').value = certificate.liquid_penetrant_testing_level_II_ExpDate?.split('T')[0] || '';

    document.getElementById('magneticParticleTesting').checked = certificate.magnetic_particle_testing_level_II;
    document.getElementById('magneticParticleTestingExp').value = certificate.magnetic_particle_testing_level_II_ExpDate?.split('T')[0] || '';

    document.getElementById('ultrasonicPhasedArray').checked = certificate.ultrasonic_Phased_Array_Level_II;
    document.getElementById('ultrasonicPhasedArrayExp').value = certificate.ultrasonic_Phased_Array_Level_II_ExpDate?.split('T')[0] || '';

    setupCertificationCheckboxes();
    document.getElementById('certificateModal').style.display = 'block';
}

// Delete certificate
function deleteCertificate(id) {

    var delid = id

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



function showDetails(id) {
    const certificate = certificates.find(cert => cert.inspectorNumber === id);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'Not set';

    // Create array of certification objects for easier filtering and mapping
    const certifications = [
        {
            name: 'Radiographic Testing Level II',
            active: certificate.radiographic_testing_level_II,
            expDate: certificate.radiographic_testing_level_II_ExpDate
        },
        {
            name: 'Ultrasonic Testing Level II',
            active: certificate.ultrasonic_testing_level_II,
            expDate: certificate.ultrasonic_testing_level_II_ExpDate
        },
        {
            name: 'UT "Phased Array"',
            active: certificate.ultrasonic_Phased_Array_Level_II,
            expDate: certificate.ultrasonic_Phased_Array_Level_II_ExpDate
        },
        {
            name: 'Visual Testing Level II',
            active: certificate.visual_testing_level_II,
            expDate: certificate.visual_testing_level_II_ExpDate
        },
        {
            name: 'Liquid Penetrant Testing Level II',
            active: certificate.liquid_penetrant_testing_level_II,
            expDate: certificate.liquid_penetrant_testing_level_II_ExpDate
        },
        {
            name: 'Magnetic Particle Testing Level II',
            active: certificate.magnetic_particle_testing_level_II,
            expDate: certificate.magnetic_particle_testing_level_II_ExpDate
        }
    ];

    // Filter to get only active certifications
    const activeCertifications = certifications.filter(cert => cert.active);

    const detailsHtml = `
        <table class="details-table">
            <tr>
                <th colspan="2">Basic Information</th>
            </tr>
            <tr>
                <td>Inspector Number</td>
                <td>${certificate.inspectorNumber}</td>
            </tr>
            <tr>
                <td>Roll Number</td>
                <td>${certificate.roll_number}</td>
            </tr>
            <tr>
                <td>Inspector Name</td>
                <td>${certificate.inspectorName}</td>
            </tr>
            <tr>
                <td>Father Name</td>
                <td>${certificate.fatherName}</td>
            </tr>
            ${activeCertifications.length > 0 ? `
                <tr>
                    <th colspan="2">Certifications</th>
                </tr>
                ${activeCertifications.map(cert => `
                    <tr>
                        <td>${cert.name}</td>
                        <td>
                            <div class="cert-status">
                                <span class="status-indicator Yes">Yes</span>
                                <span class="exp-date">${formatDate(cert.expDate)}</span>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            ` : ''}
        </table>
    `;
    document.getElementById('certificateDetails').innerHTML = detailsHtml;
    document.getElementById('detailsModal').style.display = 'block';
}


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
        }
    });
});

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
setupCertificationCheckboxes();