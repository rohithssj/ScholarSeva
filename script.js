/**
 * ScholarSeva - Scholarship Aggregator
 * Premium Vanilla JavaScript - No Framework
 * 
 * Key Features:
 * - Dynamic scholarship loading from JSON
 * - Modal-based detailed view
 * - Advanced filtering system
 * - Responsive design
 * - Save scholarship feature (localStorage)
 * - Auth system (login, register, logout)
 * - Profile page with saved scholarships
 * - Export filtered scholarships as PDF
 */

// ========================================
// STATE MANAGEMENT
// ========================================

let allScholarships = [];
let filteredScholarships = [];
let currentPage = 'home'; // 'home', 'scholarships', 'profile', 'login', 'register'

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

// Filter elements - Common
const filterElements = {
  category: document.getElementById('filter-category'),
  income: document.getElementById('filter-income'),
  state: document.getElementById('filter-state'),
  education: document.getElementById('filter-education'),
  applyBtn: document.getElementById('apply-filters'),
};

// Filter elements - Sidebar
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
  updateNavbarAuthLink();

  // Session guard for profile page
  if (currentPage === 'profile') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
    populateProfileInfo(currentUser);
  }

  // Redirect logged-in users away from login/register
  if (currentPage === 'login' || currentPage === 'register') {
    const currentUser = getCurrentUser();
    if (currentUser) {
      window.location.href = 'index.html';
      return;
    }
  }

  // Load scholarships for pages that need them
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

// ========================================
// INITIALIZE PAGE BASED ON CURRENT ROUTE
// ========================================

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

  // Get unique states from scholarships
  const states = [...new Set(allScholarships.map(s => s.state))].sort();

  // Add states to dropdown
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

/**
 * Display limited scholarships on homepage (first 20)
 */
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

/**
 * Generic scholarship rendering function
 */
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

/**
 * Open modal with scholarship details
 */
function openModal(scholarshipId) {
  const scholarship = allScholarships.find(s => s.id === scholarshipId);
  if (!scholarship) return;

  // Populate modal content
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

  // Set apply button link
  modalApplyBtn.href = scholarship.apply_link.url;

  // Show modal
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
    // Category filter
    if (category && category !== '' && scholarship.category.toLowerCase() !== category) {
      if (scholarship.category.toLowerCase() !== 'all') return false;
    }

    // Income filter
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
  } else if (currentPage === 'scholarships' && scholarshipsGrid) {
    displayAllScholarships();
  }
}

// ========================================
// AUTH FUNCTIONS (localStorage)
// ========================================

/**
 * Get current logged-in user
 */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

/**
 * Get all registered users
 */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users')) || [];
  } catch {
    return [];
  }
}

/**
 * Register a new user
 */
function registerUser(username, email, password) {
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');

  // Validation
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

  // Check duplicate email
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    errorEl.textContent = 'An account with this email already exists.';
    errorEl.style.display = 'block';
    if (successEl) successEl.style.display = 'none';
    return false;
  }

  // Create user object
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

/**
 * Login user
 */
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

  // Store session
  localStorage.setItem('currentUser', JSON.stringify(user));
  errorEl.style.display = 'none';

  window.location.href = 'index.html';
  return true;
}

/**
 * Logout user
 */
function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// ========================================
// SAVE SCHOLARSHIP FUNCTIONS
// ========================================

/**
 * Check if scholarship is saved by current user
 */
function isScholarshipSaved(scholarshipId) {
  const user = getCurrentUser();
  if (!user || !user.savedScholarships) return false;
  return user.savedScholarships.includes(scholarshipId);
}

/**
 * Save or unsave a scholarship
 */
function saveScholarship(scholarshipId) {
  const user = getCurrentUser();

  // Not logged in → redirect to login
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const savedIndex = user.savedScholarships.indexOf(scholarshipId);

  if (savedIndex === -1) {
    // Save it (prevent duplicates)
    user.savedScholarships.push(scholarshipId);
  } else {
    // Unsave it
    user.savedScholarships.splice(savedIndex, 1);
  }

  // Update currentUser in localStorage
  localStorage.setItem('currentUser', JSON.stringify(user));

  // Also update the users array
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex].savedScholarships = user.savedScholarships;
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Update the save button visually
  updateSaveButtons(scholarshipId);
}

/**
 * Update all save buttons for a given scholarship ID
 */
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

/**
 * Populate profile info
 */
function populateProfileInfo(user) {
  const usernameEl = document.getElementById('profile-username');
  const emailEl = document.getElementById('profile-email');

  if (usernameEl) usernameEl.textContent = user.username;
  if (emailEl) emailEl.textContent = user.email;
}

/**
 * Render saved scholarships on profile page
 */
function renderSavedScholarships() {
  const user = getCurrentUser();
  const container = savedScholarshipsGrid;
  const countEl = document.getElementById('saved-count');

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
    return;
  }

  // Match saved IDs with scholarship data
  const savedScholarships = allScholarships.filter(s => savedIds.includes(s.id));

  if (countEl) {
    countEl.textContent = `You have ${savedScholarships.length} saved scholarship${savedScholarships.length !== 1 ? 's' : ''}`;
  }

  container.innerHTML = '';
  savedScholarships.forEach((scholarship, index) => {
    const card = createScholarshipCard(scholarship, index);
    container.appendChild(card);
  });
}

// ========================================
// NAVBAR AUTH LINK
// ========================================

/**
 * Update navbar to show Login or Profile link
 */
function updateNavbarAuthLink() {
  const user = getCurrentUser();
  const navElements = document.querySelectorAll('nav');

  navElements.forEach(nav => {
    // Check if an auth link already exists
    const existingAuthLink = nav.querySelector('.nav-auth-link');
    if (existingAuthLink) return;

    const authLink = document.createElement('a');
    authLink.className = 'nav-auth-link';

    if (user) {
      authLink.href = 'profile.html';
      authLink.textContent = 'Profile';
    } else {
      authLink.href = 'login.html';
      authLink.textContent = 'Login';
    }

    nav.appendChild(authLink);
  });
}

// ========================================
// EXPORT FILTERED PDF
// ========================================

/**
 * Toggle export button visibility
 */
function toggleExportButton() {
  const exportBtn = document.getElementById('export-pdf-btn');
  if (!exportBtn) return;

  if (filteredScholarships.length > 0 && currentPage === 'scholarships') {
    exportBtn.style.display = 'inline-flex';
  } else {
    exportBtn.style.display = 'none';
  }
}

/**
 * Export filtered scholarships as PDF
 */
function exportFilteredPDF(filteredData) {
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

  // Helper: add new page if needed
  function checkPageBreak(requiredHeight) {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  }

  // ===== TITLE =====
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('ScholarSeva Eligible Scholarships Report', margin, yPos);
  yPos += 10;

  // ===== METADATA =====
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

  // ===== FILTER CRITERIA =====
  const filterSummary = getActiveFilterSummary();
  if (filterSummary) {
    doc.text(`Filters Applied: ${filterSummary}`, margin, yPos);
    yPos += 6;
  }

  doc.text(`Total Results: ${filteredData.length} scholarship(s)`, margin, yPos);
  yPos += 10;

  // ===== DIVIDER =====
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ===== SCHOLARSHIP LIST =====
  filteredData.forEach((s, i) => {
    checkPageBreak(60);

    // Scholarship number and name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);

    const nameLines = doc.splitTextToSize(`${i + 1}. ${s.name}`, contentWidth);
    doc.text(nameLines, margin, yPos);
    yPos += nameLines.length * 6 + 2;

    // Details
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

    // Light separator between scholarships
    if (i < filteredData.length - 1) {
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
  doc.text('Generated by ScholarSeva - Empowering Students Through Scholarships', margin, pageHeight - 10);

  // Save
  doc.save('ScholarSeva_Eligible_Scholarships.pdf');
}

/**
 * Get a readable summary of active filter criteria
 */
function getActiveFilterSummary() {
  const parts = [];
  const filterObj = sidebarFilterElements.category ? sidebarFilterElements : filterElements;

  if (filterObj.category && filterObj.category.value) {
    parts.push(`Category: ${filterObj.category.options[filterObj.category.selectedIndex].text}`);
  }
  if (filterObj.income && filterObj.income.value) {
    parts.push(`Income: ₹${filterObj.income.value}`);
  }
  if (filterObj.state && filterObj.state.value) {
    parts.push(`State: ${filterObj.state.value}`);
  }
  if (filterObj.education && filterObj.education.value) {
    parts.push(`Education: ${filterObj.education.options[filterObj.education.selectedIndex].text}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'None (showing all)';
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Modal close buttons (only if modal elements exist)
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

  // Event delegation for dynamic buttons
  document.addEventListener('click', (e) => {
    // View Details button
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

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      loginUser(email, password);
    });
  }

  // Register form
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      registerUser(username, email, password);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  // Export PDF button
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportFilteredPDF(filteredScholarships);
    });
  }
}


/**
 * Show error message to user
 */
function showErrorMessage(message) {
  console.error(message);
  if (homeScholarships) {
    homeScholarships.innerHTML = `<div class="empty-state"><h2>Error</h2><p>${message}</p></div>`;
  }
  if (scholarshipsGrid) {
    scholarshipsGrid.innerHTML = `<div class="empty-state"><h2>Error</h2><p>${message}</p></div>`;
  }
}