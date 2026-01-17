const API_URL = 'https://awswelding.runasp.net';

let inspectors = [];
let masterCertificates = []; // Master certificate types
let courses = [];
let isEditingInspector = false;
let isEditingCertificate = false;
let isEditingCourse = false;
let editingInspectorId = null;
let editingCertificateId = null;
let editingCourseId = null;
let username, password;

// ============= AUTH =============
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
    loadMasterCertificates(); // Load certificate types first
    fetchInspectors();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;

    try {
        const response = await axios.post(`${API_URL}/api/Account/Login`, { userName: username, passsword: password });
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);
        showDashboard();
    } catch (error) {
        alert('Login failed. Please check your credentials.');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    showLogin();
});

// ============= MASTER CERTIFICATES =============
async function loadMasterCertificates() {
    try {
        const response = await axios.get(`${API_URL}/api/Certificates/active`);
        masterCertificates = response.data;
        renderCertificateCheckboxes();
    } catch (error) {
        console.error('Error loading master certificates:', error);
    }
}

function renderCertificateCheckboxes() {
    const container = document.getElementById('certificatesCheckboxes');
    if (!container) return;

    container.innerHTML = masterCertificates.map(cert => `
        <div class="certificate-checkbox-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <label style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" 
                       data-cert-id="${cert.id}" 
                       data-cert-name="${cert.certificateName}"
                       class="cert-checkbox">
                <span style="flex: 1; font-weight: 500;">${cert.certificateName}</span>
                <input type="date" 
                       class="cert-expiry" 
                       data-cert-id="${cert.id}"
                       style="padding: 5px;" 
                       placeholder="Expiry Date"
                       disabled>
            </label>
        </div>
    `).join('');

    // Enable/disable expiry date inputs
    document.querySelectorAll('.cert-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const expiryInput = container.querySelector(`.cert-expiry[data-cert-id="${this.dataset.certId}"]`);
            expiryInput.disabled = !this.checked;
            if (!this.checked) expiryInput.value = '';
        });
    });
}

// ============= INSPECTORS =============
async function fetchInspectors() {
    try {
        const response = await axios.get(`${API_URL}/api/Inspectors/all`, {
            headers: { username, password }
        });
        inspectors = response.data;
        renderInspectorsTable();
    } catch (error) {
        console.error('Error fetching inspectors:', error);
        alert('Error loading inspectors');
    }
}

function renderInspectorsTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Inspector #</th>
                    <th>Full Name</th>
                    <th>Certificates</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${inspectors.map(inspector => `
                    <tr>
                        <td>${inspector.inspectorNumber}</td>
                        <td>${inspector.fullName}</td>
                        <td>${inspector.certificates ? inspector.certificates.length : 0} certificates</td>
                        <td>
                            <button onclick="editInspector(${inspector.inspectorNumber})">Edit</button>
                            <button onclick="deleteInspector(${inspector.inspectorNumber})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('certificateTable').innerHTML = tableHtml;
}

document.getElementById('addCertificateBtn').addEventListener('click', () => {
    isEditingInspector = false;
    document.getElementById('formTitle').textContent = 'Add New Inspector';
    document.getElementById('certificateForm').reset();

    // Uncheck all checkboxes and disable expiry fields
    document.querySelectorAll('.cert-checkbox').forEach(cb => {
        cb.checked = false;
        const expiryInput = document.querySelector(`.cert-expiry[data-cert-id="${cb.dataset.certId}"]`);
        if (expiryInput) {
            expiryInput.disabled = true;
            expiryInput.value = '';
        }
    });

    document.getElementById('certificateModal').style.display = 'block';
});

async function editInspector(inspectorNumber) {
    const inspector = inspectors.find(i => i.inspectorNumber === inspectorNumber);
    if (!inspector) return;

    isEditingInspector = true;
    editingInspectorId = inspectorNumber;

    document.getElementById('formTitle').textContent = 'Edit Inspector';
    document.getElementById('inspectorNumber').value = inspector.inspectorNumber;
    document.getElementById('fullName').value = inspector.fullName;

    // Reset all checkboxes first
    document.querySelectorAll('.cert-checkbox').forEach(cb => {
        cb.checked = false;
        const expiryInput = document.querySelector(`.cert-expiry[data-cert-id="${cb.dataset.certId}"]`);
        if (expiryInput) {
            expiryInput.disabled = true;
            expiryInput.value = '';
        }
    });

    // Check and populate the inspector's certificates
    if (inspector.certificates) {
        inspector.certificates.forEach(cert => {
            const checkbox = document.querySelector(`.cert-checkbox[data-cert-id="${cert.certificateId}"]`);
            if (checkbox) {
                checkbox.checked = true;
                const expiryInput = document.querySelector(`.cert-expiry[data-cert-id="${cert.certificateId}"]`);
                if (expiryInput) {
                    expiryInput.disabled = false;
                    if (cert.expiryDate) {
                        expiryInput.value = new Date(cert.expiryDate).toISOString().split('T')[0];
                    }
                }
            }
        });
    }

    document.getElementById('certificateModal').style.display = 'block';
}

async function deleteInspector(inspectorNumber) {
    if (!confirm('Are you sure you want to delete this inspector?')) return;

    try {
        await axios.delete(`${API_URL}/api/Inspectors/${inspectorNumber}`, {
            headers: { username, password }
        });
        fetchInspectors();
    } catch (error) {
        alert('Error deleting inspector');
    }
}

document.getElementById('certificateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const inspectorNumber = parseInt(document.getElementById('inspectorNumber').value);
    const fullName = document.getElementById('fullName').value;

    // Collect selected certificates
    const certificates = [];
    document.querySelectorAll('.cert-checkbox:checked').forEach(checkbox => {
        const expiryInput = document.querySelector(`.cert-expiry[data-cert-id="${checkbox.dataset.certId}"]`);
        const expiryDate = expiryInput?.value || null;

        certificates.push({
            certificateId: checkbox.dataset.certId,
            certificateName: checkbox.dataset.certName,
            expiryDate: expiryDate
        });
    });

    const inspectorData = {
        inspectorNumber,
        fullName,
        certificates
    };

    try {
        if (isEditingInspector) {
            await axios.put(`${API_URL}/api/Inspectors/${editingInspectorId}`, inspectorData, {
                headers: { username, password }
            });
        } else {
            await axios.post(`${API_URL}/api/Inspectors`, inspectorData, {
                headers: { username, password }
            });
        }
        document.getElementById('certificateModal').style.display = 'none';
        fetchInspectors();
    } catch (error) {
        alert('Error saving inspector: ' + (error.response?.data?.message || error.message));
    }
});

// ============= CERTIFICATE TYPES MANAGEMENT =============
async function fetchCertificateTypes() {
    try {
        const response = await axios.get(`${API_URL}/api/Certificates/all`, {
            headers: { username, password }
        });
        masterCertificates = response.data;
        renderCertificateTypesTable();
    } catch (error) {
        console.error('Error fetching certificate types:', error);
    }
}

function renderCertificateTypesTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Certificate Name</th>
                    <th>Code</th>
                    <th>Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${masterCertificates.map(cert => `
                    <tr>
                        <td>${cert.certificateName}</td>
                        <td>${cert.certificateCode}</td>
                        <td>${cert.isActive ? '✓' : '✗'}</td>
                        <td>
                            <button onclick="editCertificateType('${cert.id}')">Edit</button>
                            <button onclick="deleteCertificateType('${cert.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('certificateListTable').innerHTML = tableHtml;
}

document.getElementById('addNewCertificateBtn').addEventListener('click', () => {
    isEditingCertificate = false;
    document.getElementById('newCertFormTitle').textContent = 'Add Certificate Type';
    document.getElementById('newCertificateForm').reset();
    document.getElementById('certActive').checked = true;
    document.getElementById('newCertificateModal').style.display = 'block';
});

async function editCertificateType(certId) {
    const cert = masterCertificates.find(c => c.id === certId);
    if (!cert) return;

    isEditingCertificate = true;
    editingCertificateId = certId;

    document.getElementById('newCertFormTitle').textContent = 'Edit Certificate Type';
    document.getElementById('certName').value = cert.certificateName;
    document.getElementById('certCode').value = cert.certificateCode;
    document.getElementById('certDescription').value = cert.description || '';
    document.getElementById('certActive').checked = cert.isActive;

    document.getElementById('newCertificateModal').style.display = 'block';
}

async function deleteCertificateType(certId) {
    if (!confirm('Are you sure you want to delete this certificate type?')) return;

    try {
        await axios.delete(`${API_URL}/api/Certificates/${certId}`, {
            headers: { username, password }
        });
        fetchCertificateTypes();
        loadMasterCertificates(); // Refresh checkboxes
    } catch (error) {
        alert('Error deleting certificate type');
    }
}

document.getElementById('newCertificateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const certData = {
        certificateName: document.getElementById('certName').value,
        certificateCode: document.getElementById('certCode').value,
        description: document.getElementById('certDescription').value || null,
        isActive: document.getElementById('certActive').checked
    };

    try {
        if (isEditingCertificate) {
            certData.id = editingCertificateId;
            await axios.put(`${API_URL}/api/Certificates/${editingCertificateId}`, certData, {
                headers: { username, password }
            });
        } else {
            await axios.post(`${API_URL}/api/Certificates`, certData, {
                headers: { username, password }
            });
        }
        document.getElementById('newCertificateModal').style.display = 'none';
        fetchCertificateTypes();
        loadMasterCertificates(); // Refresh checkboxes
    } catch (error) {
        alert('Error saving certificate type: ' + (error.response?.data?.message || error.message));
    }
});

// ============= COURSES (Keep existing logic) =============
async function fetchCourses() {
    try {
        const response = await axios.get(`${API_URL}/api/Certificate/all`, {
            headers: { username, password }
        });
        courses = response.data;
        renderCoursesTable();
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

function renderCoursesTable() {
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Course Title</th>
                    <th>Inspector #</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${courses.map(course => `
                    <tr>
                        <td>${course.name || ''}</td>
                        <td>${course.courseTitle}</td>
                        <td>${course.certificateID}</td>
                        <td>
                            <button onclick="editCourse(${course.certificateID})">Edit</button>
                            <button onclick="deleteCourse(${course.certificateID})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('courseTable').innerHTML = tableHtml;
}

document.getElementById('addCourseBtn').addEventListener('click', () => {
    isEditingCourse = false;
    document.getElementById('courseFormTitle').textContent = 'Add New Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseModal').style.display = 'block';
});

async function editCourse(certId) {
    const course = courses.find(c => c.certificateID === certId);
    if (!course) return;

    isEditingCourse = true;
    editingCourseId = certId;

    document.getElementById('courseFormTitle').textContent = 'Edit Course';
    document.getElementById('courseName').value = course.name || '';
    document.getElementById('courseTitle').value = course.courseTitle;
    document.getElementById('certificateID').value = course.certificateID;

    document.getElementById('courseModal').style.display = 'block';
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
        await axios.delete(`${API_URL}/api/Certificate/${courseId}`, {
            headers: { username, password }
        });
        fetchCourses();
    } catch (error) {
        alert('Error deleting course');
    }
}

document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const courseData = {
        name: document.getElementById('courseName').value,
        courseTitle: document.getElementById('courseTitle').value,
        certificateID: parseInt(document.getElementById('certificateID').value)
    };

    try {
        if (isEditingCourse) {
            await axios.put(`${API_URL}/api/Certificate/${editingCourseId}`, courseData, {
                headers: { username, password }
            });
        } else {
            await axios.post(`${API_URL}/api/Certificate`, courseData, {
                headers: { username, password }
            });
        }
        document.getElementById('courseModal').style.display = 'none';
        fetchCourses();
    } catch (error) {
        alert('Error saving course');
    }
});

// ============= TAB NAVIGATION =============
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'certificates') {
        document.getElementById('certificatesTab').classList.add('active');
        document.querySelector('[data-tab="certificates"]').classList.add('active');
        fetchInspectors();
    } else if (tabName === 'certList') {
        document.getElementById('certListTab').classList.add('active');
        document.querySelector('[data-tab="certList"]').classList.add('active');
        fetchCertificateTypes();
    } else if (tabName === 'courses') {
        document.getElementById('coursesTab').classList.add('active');
        document.querySelector('[data-tab="courses"]').classList.add('active');
        fetchCourses();
    }
}

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => showTab(button.dataset.tab));
});

// ============= MODAL CLOSE =============
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// ============= INIT =============
checkLoginStatus();