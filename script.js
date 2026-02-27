
// ========================================
// STATE MANAGEMENT
// ========================================

let allScholarships = [];
let filteredScholarships = [];
let currentPage = 'home';

// ========================================
// DOM ELEMENT REFERENCES
// ========================================

// Modal elements
const modalBackdrop = document.getElementById('modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close');
const modalCloseBtnBottom = document.getElementById('modal-close-btn');
const modalApplyBtn = document.getElementById('modal-apply-btn');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

// Filter elements - Common (homepage)
const filterElements = {
  category: document.getElementById('filter-category'),
  income: document.getElementById('filter-income'),
  state: document.getElementById('filter-state'),
  education: document.getElementById('filter-education'),
  applyBtn: document.getElementById('apply-filters'),
};

// Filter elements - Sidebar (scholarships page)
const sidebarFilterElements = {
  category: document.getElementById('sidebar-category'),
  income: document.getElementById('sidebar-income'),
  state: document.getElementById('sidebar-state'),
  education: document.getElementById('sidebar-education'),
  applyBtn: document.getElementById('sidebar-apply-filters'),
};

// Display elements
const homeScholarships = document.getElementById('home-scholarships');
const scholarshipsGrid = document.getElementById('scholarships-grid');
const resultCount = document.getElementById('resultCount');

// Auth elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Profile elements
const savedScholarshipsGrid = document.getElementById('saved-scholarships-grid');

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  detectCurrentPage();
  renderNavbar();


  if (currentPage === 'profile') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
    populateProfileInfo(currentUser);
  }

  if (currentPage === 'login' || currentPage === 'register') {
    const currentUser = getCurrentUser();
    if (currentUser) {
      window.location.href = 'index.html';
      return;
    }
  }

  if (currentPage === 'home' || currentPage === 'scholarships' || currentPage === 'profile') {
    await loadScholarships();
  }

  initializePage();
  setupEventListeners();
});

// ========================================
// DETECT CURRENT PAGE
// ========================================

function detectCurrentPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('profile')) {
    currentPage = 'profile';
  } else if (path.includes('login')) {
    currentPage = 'login';
  } else if (path.includes('register')) {
    currentPage = 'register';
  } else if (path.includes('scholarships.html') || scholarshipsGrid) {
    currentPage = 'scholarships';
  } else {
    currentPage = 'home';
  }
}

// ========================================
// NAVBAR RENDERING (FIXES DUPLICATE ISSUE)
// ========================================


function renderNavbar() {
  const user = getCurrentUser();
  const navElements = document.querySelectorAll('header.navbar nav');

  navElements.forEach(nav => {
    nav.querySelectorAll('.nav-auth-link').forEach(el => el.remove());

    if (user) {
      const profileLink = document.createElement('a');
      profileLink.href = 'profile.html';
      profileLink.textContent = 'Profile';
      profileLink.className = 'nav-auth-link';
      nav.appendChild(profileLink);

      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.textContent = 'Logout';
      logoutLink.className = 'nav-auth-link nav-logout-link';
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
      nav.appendChild(logoutLink);
    } else {
      const loginLink = document.createElement('a');
      loginLink.href = 'login.html';
      loginLink.textContent = 'Login';
      loginLink.className = 'nav-auth-link';
      nav.appendChild(loginLink);

      const registerLink = document.createElement('a');
      registerLink.href = 'register.html';
      registerLink.textContent = 'Register';
      registerLink.className = 'nav-auth-link';
      nav.appendChild(registerLink);
    }
  });
}

// ========================================
// LOAD SCHOLARSHIPS FROM JSON
// ========================================

async function loadScholarships() {
  try {
    const response = await fetch('scholarships.json');
    if (!response.ok) throw new Error('Failed to load scholarships');
    allScholarships = await response.json();
    filteredScholarships = [...allScholarships];
  } catch (error) {
    console.error('Error loading scholarships:', error);
    showErrorMessage('Failed to load scholarships. Please try again later.');
  }
}


function initializePage() {
  if (currentPage === 'home' && homeScholarships) {
    populateStateDropdown('filter-state');
    displayHomeScholarships();
  } else if (currentPage === 'scholarships' && scholarshipsGrid) {
    populateStateDropdown('filter-state');
    populateStateDropdown('sidebar-state');
    displayAllScholarships();
  } else if (currentPage === 'profile' && savedScholarshipsGrid) {
    renderSavedScholarships();
  }
}

// ========================================
// POPULATE STATE DROPDOWNS
// ========================================

function populateStateDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  const states = [...new Set(allScholarships.map(s => s.state))].sort();

  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    dropdown.appendChild(option);
  });
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================


function displayHomeScholarships() {
  if (!homeScholarships) return;

  const scholarshipsToDisplay = filteredScholarships.slice(0, 20);
  updateResultCount(scholarshipsToDisplay.length);
  renderScholarships(scholarshipsToDisplay, homeScholarships);
}

/**
 * Display all scholarships on scholarships page
 */
function displayAllScholarships() {
  if (!scholarshipsGrid) return;

  updateResultCount(filteredScholarships.length);
  renderScholarships(filteredScholarships, scholarshipsGrid);
  toggleExportButton();
}


function renderScholarships(scholarships, container) {
  container.innerHTML = '';

  if (scholarships.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h2>No Scholarships Found</h2>
        <p>Try adjusting your filters to see more results.</p>
      </div>
    `;
    return;
  }

  scholarships.forEach((scholarship, index) => {
    const scholarshipCard = createScholarshipCard(scholarship, index);
    container.appendChild(scholarshipCard);
  });
}

/**
 * Create a scholarship card element
 */
function createScholarshipCard(scholarship, index) {
  const card = document.createElement('div');
  card.className = 'card';

  const isSaved = isScholarshipSaved(scholarship.id);
  const savedClass = isSaved ? 'saved' : '';

  card.innerHTML = `
    <button class="btn-save-scholarship ${savedClass}" data-scholarship-id="${scholarship.id}" title="${isSaved ? 'Remove from saved' : 'Save scholarship'}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <div class="card-badge">${scholarship.provider.includes('Central') ? 'Central' : 'State'}</div>
    <h3>${scholarship.name}</h3>
    <div class="card-info">
      <p><strong>Provider:</strong> ${scholarship.provider}</p>
      <p><strong>State:</strong> ${scholarship.state}</p>
      <p><strong>Education:</strong> ${scholarship.education_level}</p>
      <p><strong>Income Limit:</strong> ${scholarship.income_limit}</p>
    </div>
    <div class="card-btn">
      <button class="btn-view-details" data-index="${index}" data-id="${scholarship.id}">View Details</button>
    </div>
  `;

  return card;
}

/**
 * Update result count display
 */
function updateResultCount(count) {
  if (resultCount) {
    resultCount.textContent = `Showing ${count} scholarship${count !== 1 ? 's' : ''}`;
  }
}

// ========================================
// MODAL FUNCTIONALITY
// ========================================


function openModal(scholarshipId) {
  const scholarship = allScholarships.find(s => s.id === scholarshipId);
  if (!scholarship) return;

  modalTitle.textContent = scholarship.name;
  modalBody.innerHTML = `
    <div class="modal-field">
      <label>Provider Organization</label>
      <p>${scholarship.provider}</p>
    </div>
    <div class="modal-field">
      <label>Description</label>
      <p>${scholarship.description}</p>
    </div>
    <div class="modal-field">
      <label>State</label>
      <p>${scholarship.state}</p>
    </div>
    <div class="modal-field">
      <label>Education Level</label>
      <p>${scholarship.education_level}</p>
    </div>
    <div class="modal-field">
      <label>Category</label>
      <p>${scholarship.category}</p>
    </div>
    <div class="modal-field">
      <label>Income Limit</label>
      <p>${scholarship.income_limit}</p>
    </div>
    <div class="modal-field">
      <label>Application Portal</label>
      <p>${scholarship.apply_link.site_name}</p>
    </div>
  `;

  modalApplyBtn.href = scholarship.apply_link.url;
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close modal
 */
function closeModal() {
  modalBackdrop.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ========================================
// FILTERING LOGIC
// ========================================

function applyFilters(filterObj) {
  const category = filterObj.category.value.toLowerCase();
  const income = filterObj.income.value;
  const state = filterObj.state.value;
  const education = filterObj.education.value;

  filteredScholarships = allScholarships.filter(scholarship => {
    if (category && category !== '' && scholarship.category.toLowerCase() !== category) {
      if (scholarship.category.toLowerCase() !== 'all') return false;
    }

    if (income) {
      const incomeLimit = scholarship.income_limit.toLowerCase();
      if (!incomeLimit.includes('varies') && !incomeLimit.includes('as per')) {
        const limit = parseInt(incomeLimit.replace(/[^0-9]/g, ''));
        if (!isNaN(limit) && limit < income) return false;
      }
    }

    if (state && scholarship.state !== state && scholarship.state !== 'All India') {
      return false;
    }

    if (education) {
      const eduLevel = scholarship.education_level.toLowerCase();
      if (!eduLevel.includes(education.toLowerCase())) return false;
    }

    return true;
  });

  if (currentPage === 'home' && homeScholarships) {
    displayHomeScholarships();
    toggleExportButton();
  } else if (currentPage === 'scholarships' && scholarshipsGrid) {
    displayAllScholarships();
  }
}

// ========================================
// AUTH FUNCTIONS (localStorage)
// ========================================


function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}


function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users')) || [];
  } catch {
    return [];
  }
}


function registerUser(username, email, password) {
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');

  if (!username || !email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    return false;
  }

  if (password.length < 4) {
    errorEl.textContent = 'Password must be at least 4 characters.';
    errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    return false;
  }

  const users = getUsers();

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    errorEl.textContent = 'An account with this email already exists.';
    errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    return false;
  }

  const newUser = {
    id: Date.now(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    savedScholarships: []
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  errorEl.style.display = 'none';
  if (successEl) {
    successEl.textContent = 'Account created! Redirecting to login...';
    successEl.style.display = 'block';
  }

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1200);

  return true;
}


function loginUser(email, password) {
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    errorEl.style.display = 'block';
    return false;
  }

  const users = getUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    errorEl.textContent = 'Invalid email or password. Please try again.';
    errorEl.style.display = 'block';
    return false;
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  errorEl.style.display = 'none';
  window.location.href = 'index.html';
  return true;
}


function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// ========================================
// SAVE SCHOLARSHIP FUNCTIONS
// ========================================


function isScholarshipSaved(scholarshipId) {
  const user = getCurrentUser();
  if (!user || !user.savedScholarships) return false;
  return user.savedScholarships.includes(scholarshipId);
}


function saveScholarship(scholarshipId) {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const savedIndex = user.savedScholarships.indexOf(scholarshipId);

  if (savedIndex === -1) {
    user.savedScholarships.push(scholarshipId);
  } else {
    user.savedScholarships.splice(savedIndex, 1);
  }

  localStorage.setItem('currentUser', JSON.stringify(user));

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex].savedScholarships = user.savedScholarships;
    localStorage.setItem('users', JSON.stringify(users));
  }

  updateSaveButtons(scholarshipId);
}


function updateSaveButtons(scholarshipId) {
  const buttons = document.querySelectorAll(`.btn-save-scholarship[data-scholarship-id="${scholarshipId}"]`);
  const isSaved = isScholarshipSaved(scholarshipId);

  buttons.forEach(btn => {
    if (isSaved) {
      btn.classList.add('saved');
      btn.title = 'Remove from saved';
    } else {
      btn.classList.remove('saved');
      btn.title = 'Save scholarship';
    }

    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
    }
  });
}

// ========================================
// PROFILE PAGE FUNCTIONS
// ========================================


function populateProfileInfo(user) {
  const usernameEl = document.getElementById('profile-username');
  const emailEl = document.getElementById('profile-email');

  if (usernameEl) usernameEl.textContent = user.username;
  if (emailEl) emailEl.textContent = user.email;
}


function renderSavedScholarships() {
  const user = getCurrentUser();
  const container = savedScholarshipsGrid;
  const countEl = document.getElementById('saved-count');
  const exportBtn = document.getElementById('export-saved-pdf-btn');

  if (!user || !container) return;

  const savedIds = user.savedScholarships || [];

  if (savedIds.length === 0) {
    if (countEl) countEl.textContent = 'You haven\'t saved any scholarships yet.';
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h2>No Saved Scholarships</h2>
        <p>Browse scholarships and click the bookmark icon to save them here.</p>
      </div>
    `;
    if (exportBtn) exportBtn.style.display = 'none';
    return;
  }

  const savedScholarships = allScholarships.filter(s => savedIds.includes(s.id));

  if (countEl) {
    countEl.textContent = `You have ${savedScholarships.length} saved scholarship${savedScholarships.length !== 1 ? 's' : ''}`;
  }

  container.innerHTML = '';
  savedScholarships.forEach((scholarship, index) => {
    const card = createScholarshipCard(scholarship, index);
    container.appendChild(card);
  });

  if (exportBtn && savedScholarships.length > 0) {
    exportBtn.style.display = 'inline-flex';
  }
}

// ========================================
// EXPORT PDF FUNCTIONS
// ========================================


function showExportButton() {
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) exportBtn.style.display = 'inline-flex';
}

function hideExportButton() {
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) exportBtn.style.display = 'none';
}


function toggleExportButton() {
  if (filteredScholarships.length > 0) {
    showExportButton();
  } else {
    hideExportButton();
  }
}


function getActiveFilterSummary() {
  const parts = [];
  const filterObj = sidebarFilterElements.category ? sidebarFilterElements : filterElements;

  if (filterObj.category && filterObj.category.value) {
    parts.push(`Category: ${filterObj.category.options[filterObj.category.selectedIndex].text}`);
  }
  if (filterObj.income && filterObj.income.value) {
    parts.push(`Income: Rs.${filterObj.income.value}`);
  }
  if (filterObj.state && filterObj.state.value) {
    parts.push(`State: ${filterObj.state.value}`);
  }
  if (filterObj.education && filterObj.education.value) {
    parts.push(`Education: ${filterObj.education.options[filterObj.education.selectedIndex].text}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'None (showing all)';
}


function generateScholarshipPDF(scholarships, title, filterSummary, filename) {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF library is loading. Please try again in a moment.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  function checkPageBreak(requiredHeight) {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(title, margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN')}`, margin, yPos);
  yPos += 6;

  const user = getCurrentUser();
  if (user) {
    doc.text(`User: ${user.username} (${user.email})`, margin, yPos);
    yPos += 6;
  }

  // ===== FILTER CRITERIA (if provided) =====
  if (filterSummary !== null) {
    doc.text(`Filters Applied: ${filterSummary}`, margin, yPos);
    yPos += 6;
  }

  doc.text(`Total Results: ${scholarships.length} scholarship(s)`, margin, yPos);
  yPos += 10;

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  scholarships.forEach((s, i) => {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);

    const nameLines = doc.splitTextToSize(`${i + 1}. ${s.name}`, contentWidth);
    doc.text(nameLines, margin, yPos);
    yPos += nameLines.length * 6 + 2;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const details = [
      `State: ${s.state}`,
      `Education Level: ${s.education_level}`,
      `Provider: ${s.provider}`,
      `Category: ${s.category}`,
      `Income Limit: ${s.income_limit}`,
      `Portal: ${s.apply_link.site_name}`,
      `Apply Link: ${s.apply_link.url}`
    ];

    details.forEach(detail => {
      checkPageBreak(8);
      doc.text(`   ${detail}`, margin, yPos);
      yPos += 5;
    });

    yPos += 6;

    if (i < scholarships.length - 1) {
      checkPageBreak(4);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
    }
  });

  // ===== FOOTER ON LAST PAGE =====
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by ScholarSeva', margin, pageHeight - 14);
  doc.text('Platform under development. Scholarships updated weekly.', margin, pageHeight - 10);

  // Save
  doc.save(filename);
}


function exportFilteredPDF(filteredData) {
  const filterSummary = getActiveFilterSummary();
  generateScholarshipPDF(
    filteredData,
    'ScholarSeva Eligible Scholarships Report',
    filterSummary,
    'ScholarSeva_Eligible_Scholarships.pdf'
  );
}


function exportSavedScholarshipsPDF() {
  const user = getCurrentUser();
  if (!user) return;

  const savedIds = user.savedScholarships || [];
  const savedScholarships = allScholarships.filter(s => savedIds.includes(s.id));

  if (savedScholarships.length === 0) {
    alert('No saved scholarships to export.');
    return;
  }

  generateScholarshipPDF(
    savedScholarships,
    'ScholarSeva Saved Scholarships Report',
    null,
    'ScholarSeva_Saved_Scholarships.pdf'
  );
}



function setupEventListeners() {
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }
  if (modalCloseBtnBottom) {
    modalCloseBtnBottom.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  // Home page filter button
  if (filterElements.applyBtn) {
    filterElements.applyBtn.addEventListener('click', () => {
      applyFilters(filterElements);
    });
  }

  // Scholarships page filter button
  if (sidebarFilterElements.applyBtn) {
    sidebarFilterElements.applyBtn.addEventListener('click', () => {
      applyFilters(sidebarFilterElements);
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-view-details')) {
      const scholarshipId = e.target.dataset.id;
      openModal(scholarshipId);
    }

    // Save scholarship button
    const saveBtn = e.target.closest('.btn-save-scholarship');
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      const scholarshipId = saveBtn.dataset.scholarshipId;
      saveScholarship(scholarshipId);
    }
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      loginUser(email, password);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      registerUser(username, email, password);
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  // Export filtered PDF button (homepage & scholarships page)
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportFilteredPDF(filteredScholarships);
    });
  }

  const exportSavedBtn = document.getElementById('export-saved-pdf-btn');
  if (exportSavedBtn) {
    exportSavedBtn.addEventListener('click', () => {
      exportSavedScholarshipsPDF();
    });
  }
}


function showErrorMessage(message) {
  console.error(message);
  if (homeScholarships) {
    homeScholarships.innerHTML = `<div class="empty-state"><h2>Error</h2><p>${message}</p></div>`;
  }
  if (scholarshipsGrid) {
    scholarshipsGrid.innerHTML = `<div class="empty-state"><h2>Error</h2><p>${message}</p></div>`;
  }
}