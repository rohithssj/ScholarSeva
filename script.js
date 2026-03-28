
// ========================================
// UTILS & HELPERS
// ========================================

function formatCurrency(num) {
  if (num === null || num === undefined) return "N/A";
  return num.toLocaleString('en-IN');
}

function getBadgeType(scholarship) {
  return scholarship.provider.toLowerCase().includes('central') ? 'Central' : 'State';
}

function renderDocuments(scholarship) {
  if (!scholarship.documents_required || scholarship.documents_required.length === 0) {
    return `<p>Documents may vary. Check official portal.</p>`;
  }
  return `<ul>${scholarship.documents_required.map(doc => `<li>${doc}</li>`).join('')}</ul>`;
}

function renderSteps() {
  return `
    <div class="apply-steps">
      <ol>
        <li>Visit official portal</li>
        <li>Register/Login</li>
        <li>Fill application form</li>
        <li>Upload documents</li>
        <li>Submit and track status</li>
      </ol>
    </div>
  `;
}

function copyLink(url, btnElement) {
  navigator.clipboard.writeText(url).then(() => {
    const originalText = btnElement.textContent;
    btnElement.textContent = 'Link Copied!';
    btnElement.style.backgroundColor = '#28a745';
    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.style.backgroundColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy link: ', err);
    alert('Failed to copy link. Please manually copy: ' + url);
  });
}

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
  search: document.getElementById('filter-search'),
  applyBtn: document.getElementById('apply-filters'),
};

// Filter elements - Sidebar (scholarships page)
const sidebarFilterElements = {
  category: document.getElementById('sidebar-category'),
  income: document.getElementById('sidebar-income'),
  state: document.getElementById('sidebar-state'),
  education: document.getElementById('sidebar-education'),
  search: document.getElementById('sidebar-search'),
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
    renderRecommendedSection();
    checkDeadlineAlerts();
  } else if (currentPage === 'scholarships' && scholarshipsGrid) {
    populateStateDropdown('filter-state');
    populateStateDropdown('sidebar-state');
    displayAllScholarships();
  } else if (currentPage === 'profile' && savedScholarshipsGrid) {
    renderSavedScholarships();
    setupProfileUpdate();
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

  const user = getCurrentUser();
  const matchScore = calculateMatchScore(user, scholarship);
  const successChance = getSuccessChance(matchScore, scholarship);
  const deadlineStatus = getDeadlineStatus(scholarship.application_end);
  const isSaved = isScholarshipSaved(scholarship.id);
  const savedClass = isSaved ? 'saved' : '';
  const status = getScholarshipStatus(scholarship.id);

  card.innerHTML = `
    <button class="btn-save-scholarship ${savedClass}" data-scholarship-id="${scholarship.id}" title="${isSaved ? 'Remove from saved' : 'Save scholarship'}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <div class="card-badge ${getBadgeType(scholarship).toLowerCase()}">${getBadgeType(scholarship)}</div>
    
    <div class="card-metrics">
       <div class="metric match-score">Match: <span>${matchScore}%</span></div>
       <div class="metric success-chance">Success: <span>${successChance}%</span></div>
    </div>

    <div id="ai-priority-${scholarship.id}" class="ai-priority-badge"></div>

    <h3>${scholarship.name}</h3>
    
    <div class="card-info">
      <p><strong>Provider:</strong> ${scholarship.provider}</p>
      <p><strong>State:</strong> ${scholarship.state}</p>
      <p><strong>Education:</strong> ${scholarship.education_level}</p>
      <div class="deadline-status ${deadlineStatus.class}">${deadlineStatus.status}</div>
    </div>

    ${currentPage === 'profile' && isSaved ? `
      <div class="status-tracker">
        <label>Status:</label>
        <select class="status-toggle" data-id="${scholarship.id}">
          <option value="saved" ${status === 'saved' ? 'selected' : ''}>Saved</option>
          <option value="interested" ${status === 'interested' ? 'selected' : ''}>Interested</option>
          <option value="applied" ${status === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
    ` : ''}

    <div class="card-btn">
      <button class="btn-view-details" data-id="${scholarship.id}">View Details</button>
      <button class="btn-compare ${compareList.includes(scholarship.id) ? 'added' : ''}" data-id="${scholarship.id}">
        ${compareList.includes(scholarship.id) ? 'Added' : 'Compare'}
      </button>
    </div>
  `;

  // Trigger priority message if score is high
  if (matchScore >= 80) {
    setTimeout(() => triggerPriorityMessage(scholarship, matchScore, deadlineStatus.daysRem), 100);
  }

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
      ${scholarship.income_limit && scholarship.income_limit.value !== undefined
        ? `<p>₹${formatCurrency(scholarship.income_limit.value)}</p>
           <p style="font-size: 0.9rem; color: #666;">Note: ${scholarship.income_limit.note}</p>`
        : `<p>As per official guidelines</p>`
      }
    </div>
    <div class="modal-field">
      <label>Application Portal</label>
      <p>${scholarship.apply_link.site_name}</p>
    </div>
    <div class="modal-field">
      <label>Required Documents</label>
      <div class="modal-docs">
        ${renderDocuments(scholarship)}
      </div>
    </div>
    <div class="modal-field">
      <label>How to Apply</label>
      ${renderSteps()}
    </div>

    <!-- AI ADVISOR SECTION -->
    <div id="ai-advisor-container">
      <div class="ai-section">
        <h4>AI Quick Summary</h4>
        <div id="ai-quick-summary-body" class="ai-loading">Generating summary...</div>
      </div>
      <div class="ai-section">
        <h4>Why this Match?</h4>
        <div id="ai-match-explanation-body" class="ai-loading">Generating explanation...</div>
      </div>
    </div>
  `;

  // Trigger AI Features for Modal
  triggerModalAIFeatures(scholarship);

  modalApplyBtn.href = scholarship.apply_link.url;
  
  const copyBtn = document.getElementById('modal-copy-link-btn');
  if (copyBtn) {
    copyBtn.dataset.url = scholarship.apply_link.url;
    // Clear old event listeners if any, or just add one once.
    // Since we open the modal many times, we should check if we already added it.
    // But in this setup, we can just replace the listener or use a fresh button if we were recreating the modal.
    // However, the simplest is to just set the dataset and ensure the listener is added in setupEventListeners.
  }

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
  const search = filterObj.search ? filterObj.search.value.toLowerCase() : '';

  filteredScholarships = allScholarships.filter(scholarship => {
    if (search) {
      const nameMatch = scholarship.name.toLowerCase().includes(search);
      const stateMatch = scholarship.state.toLowerCase().includes(search);
      if (!nameMatch && !stateMatch) return false;
    }

    if (category && category !== '' && scholarship.category.toLowerCase() !== category) {
      if (scholarship.category.toLowerCase() !== 'all') return false;
    }

    if (income && scholarship.income_limit && scholarship.income_limit.value !== undefined) {
      if (!(income === "" || scholarship.income_limit.value >= Number(income))) {
        return false;
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
  return user.savedScholarships.some(s => (typeof s === 'string' ? s === scholarshipId : s.id === scholarshipId));
}


function saveScholarship(scholarshipId) {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const savedIndex = user.savedScholarships.findIndex(s => (typeof s === 'string' ? s === scholarshipId : s.id === scholarshipId));

  if (savedIndex === -1) {
    user.savedScholarships.push({ id: scholarshipId, status: 'saved' });
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

function getScholarshipStatus(scholarshipId) {
  const user = getCurrentUser();
  if (!user || !user.savedScholarships) return 'none';
  const item = user.savedScholarships.find(s => (typeof s === 'string' ? s === scholarshipId : s.id === scholarshipId));
  return (item && item.status) ? item.status : (item ? 'saved' : 'none');
}

function updateScholarshipStatus(scholarshipId, status) {
  const user = getCurrentUser();
  if (!user) return;

  const item = user.savedScholarships.find(s => (typeof s === 'string' ? s === scholarshipId : s.id === scholarshipId));
  if (item) {
    if (typeof item === 'string') {
      const idx = user.savedScholarships.indexOf(scholarshipId);
      user.savedScholarships[idx] = { id: scholarshipId, status: status };
    } else {
      item.status = status;
    }
  } else {
    user.savedScholarships.push({ id: scholarshipId, status: status });
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  const users = getUsers();
  const uIdx = users.findIndex(u => u.id === user.id);
  if (uIdx !== -1) {
    users[uIdx].savedScholarships = user.savedScholarships;
    localStorage.setItem('users', JSON.stringify(users));
  }
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
    
    // Feature enhancement: Optional visual check
    const existingCheck = btn.querySelector('.save-check');
    if (isSaved && !existingCheck) {
      const check = document.createElement('span');
      check.className = 'save-check';
      check.innerHTML = '✔';
      check.style.marginLeft = '4px';
      btn.appendChild(check);
    } else if (!isSaved && existingCheck) {
      existingCheck.remove();
    }
  });
}

// ========================================
// SMART RECOMMENDATION ENGINE
// ========================================

function calculateMatchScore(user, scholarship) {
  if (!user) return 0;
  let score = 0;

  // Category match → +25
  const userCat = user.category ? user.category.toLowerCase() : '';
  const scholCat = scholarship.category ? scholarship.category.toLowerCase() : '';
  if (scholCat === 'all' || (userCat && scholCat === userCat)) {
    score += 25;
  }

  // Income eligibility → +25
  const userIncome = user.income ? Number(user.income) : Infinity;
  if (scholarship.income_limit && scholarship.income_limit.value !== undefined) {
    if (userIncome <= scholarship.income_limit.value) {
      score += 25;
    }
  } else {
    score += 25; // No limit = match
  }

  // State match → +20
  const userState = user.state ? user.state.toLowerCase() : '';
  const scholState = scholarship.state ? scholarship.state.toLowerCase() : '';
  if (scholState === 'all india' || (userState && scholState === userState)) {
    score += 20;
  }

  // Education match → +30
  const userEdu = user.education ? user.education.toLowerCase() : '';
  const scholEdu = scholarship.education_level ? scholarship.education_level.toLowerCase() : '';
  if (userEdu && scholEdu.includes(userEdu)) {
    score += 30;
  }

  return score;
}

function getSuccessChance(matchScore, scholarship) {
  let chance = matchScore;

  if (scholarship.income_limit && scholarship.income_limit.value !== undefined) {
    const limit = scholarship.income_limit.value;
    if (limit > 300000) {
      chance += 10;
    } else if (limit < 150000) {
      chance -= 10;
    }
  }

  return Math.max(0, Math.min(100, chance));
}

function getRecommendedScholarships(user, scholarships) {
  if (!user) return [];
  
  const scored = scholarships.map(s => ({
    ...s,
    matchScore: calculateMatchScore(user, s)
  }));

  return scored
    .filter(s => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

// ========================================
// DEADLINE ALERT SYSTEM
// ========================================

function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr) return { status: 'Ongoing', class: 'ongoing', daysRem: null };

  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'Closed', class: 'closed', daysRem: diffDays };
  if (diffDays <= 3) return { status: 'Last chance', class: 'urgent', daysRem: diffDays };
  return { status: `Closing in ${diffDays} days`, class: 'soon', daysRem: diffDays };
}

// ========================================
// COMPARISON FUNCTIONS
// ========================================

let compareList = [];

function toggleCompare(scholarshipId) {
  const index = compareList.indexOf(scholarshipId);
  if (index === -1) {
    if (compareList.length >= 3) {
      alert("You can only compare up to 3 scholarships.");
      return;
    }
    compareList.push(scholarshipId);
  } else {
    compareList.splice(index, 1);
  }
  
  updateCompareButtons();
  if (compareList.length > 0) {
    showCompareFloatingBtn();
  } else {
    hideCompareFloatingBtn();
  }
}

function updateCompareButtons() {
  const buttons = document.querySelectorAll('.btn-compare');
  buttons.forEach(btn => {
    const id = btn.dataset.id;
    if (compareList.includes(id)) {
      btn.classList.add('added');
      btn.textContent = 'Added to Compare';
    } else {
      btn.classList.remove('added');
      btn.textContent = 'Compare';
    }
  });
}

function showCompareFloatingBtn() {
  let btn = document.getElementById('floating-compare-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'floating-compare-btn';
    btn.className = 'floating-compare-btn';
    btn.innerHTML = `Compare (${compareList.length}/3)`;
    btn.onclick = openCompareModal;
    document.body.appendChild(btn);
  } else {
    btn.innerHTML = `Compare (${compareList.length}/3)`;
    btn.style.display = 'block';
  }
}

function hideCompareFloatingBtn() {
  const btn = document.getElementById('floating-compare-btn');
  if (btn) btn.style.display = 'none';
}

function openCompareModal() {
  const modal = document.getElementById('compare-modal-backdrop') || createCompareModalHTML();
  renderCompareTable();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
  const modal = document.getElementById('compare-modal-backdrop');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function createCompareModalHTML() {
  const backdrop = document.createElement('div');
  backdrop.id = 'compare-modal-backdrop';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal compare-modal" id="compare-modal-content">
      <button class="modal-close" id="compare-modal-close">✕</button>
      <h2>Compare Scholarships</h2>
      <div class="modal-content" id="compare-table-container"></div>
      <div class="modal-actions">
        <button class="btn btn-close-modal" id="compare-modal-close-btn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.getElementById('compare-modal-close').onclick = closeCompareModal;
  document.getElementById('compare-modal-close-btn').onclick = closeCompareModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeCompareModal(); };
  return backdrop;
}

function renderCompareTable() {
  const container = document.getElementById('compare-table-container');
  const user = getCurrentUser();
  const selected = allScholarships.filter(s => compareList.includes(s.id));
  
  if (selected.length === 0) {
    container.innerHTML = "<p>No scholarships selected for comparison.</p>";
    return;
  }

  const scored = selected.map(s => {
    const score = calculateMatchScore(user, s);
    return {
      ...s,
      score: score,
      success: getSuccessChance(score, s)
    };
  });
  
  const maxScore = Math.max(...scored.map(s => s.score));
  
  let html = `
    <div class="table-responsive">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            ${scored.map(s => `
              <th class="${s.score === maxScore && maxScore > 0 ? 'best-choice-col' : ''}">
                ${s.score === maxScore && maxScore > 0 ? '<div class="best-badge">Best Choice</div>' : ''}
                <div class="compare-th-content">${s.name}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Provider</strong></td>${scored.map(s => `<td>${s.provider}</td>`).join('')}</tr>
          <tr><td><strong>Income Limit</strong></td>${scored.map(s => `<td>₹${s.income_limit ? formatCurrency(s.income_limit.value) : 'N/A'}</td>`).join('')}</tr>
          <tr><td><strong>Category</strong></td>${scored.map(s => `<td>${s.category}</td>`).join('')}</tr>
          <tr><td><strong>Education</strong></td>${scored.map(s => `<td>${s.education_level}</td>`).join('')}</tr>
          <tr><td><strong>Benefits</strong></td>${scored.map(s => `<td>${s.description.substring(0, 100)}...</td>`).join('')}</tr>
          <tr><td><strong>Deadline</strong></td>${scored.map(s => `<td>${s.application_end || 'Ongoing'}</td>`).join('')}</tr>
          <tr><td><strong>Match Score</strong></td>${scored.map(s => `<td><span class="score-badge">${s.score}%</span></td>`).join('')}</tr>
          <tr><td><strong>Success %</strong></td>${scored.map(s => `<td><span class="success-badge">${s.success}%</span></td>`).join('')}</tr>
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html + `<div id="ai-compare-summary" class="ai-compare-box ai-loading">Generating AI comparison summary...</div>`;
  
  // Trigger AI Comparison
  triggerCompareAISummary(scored);
}

function triggerModalAIFeatures(scholarship) {
  const user = getCurrentUser();
  const summaryBody = document.getElementById('ai-quick-summary-body');
  const explanationBody = document.getElementById('ai-match-explanation-body');

  if (summaryBody) {
    generateQuickSummary(scholarship).then(result => {
      summaryBody.classList.remove('ai-loading');
      summaryBody.innerHTML = `<div class="ai-result">${formatAIReturn(result)}</div>`;
    });
  }

  if (explanationBody && user) {
    generateMatchExplanation(user, scholarship).then(result => {
      explanationBody.classList.remove('ai-loading');
      explanationBody.innerHTML = `<div class="ai-result">${formatAIReturn(result)}</div>`;
    });
  }
}

function triggerCompareAISummary(scholarships) {
  const container = document.getElementById('ai-compare-summary');
  if (!container) return;

  generateCompareSummary(scholarships).then(result => {
    container.classList.remove('ai-loading');
    container.innerHTML = `
      <h4>AI Insight</h4>
      <div class="ai-result">${formatAIReturn(result)}</div>
    `;
  });
}

function formatAIReturn(text) {
  if (text.startsWith('Error:')) return `<span style="color: #ef4444;">${text}</span>`;
  
  // Convert bullet points (starts with * or - or digit) into list items
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.some(l => l.trim().startsWith('*') || l.trim().startsWith('-') || /^\d+\./.test(l.trim()))) {
    return `<ul>${lines.map(l => {
      let content = l.trim().replace(/^[\*\-\d\.]+\s*/, '');
      return `<li>${content}</li>`;
    }).join('')}</ul>`;
  }
  return text.replace(/\n/g, '<br>');
}


// ========================================
// PROFILE PAGE FUNCTIONS
// ========================================


function populateProfileInfo(user) {
  const usernameEl = document.getElementById('profile-username');
  const emailEl = document.getElementById('profile-email');

  if (usernameEl) usernameEl.textContent = user.username;
  if (emailEl) emailEl.textContent = user.email;

  // Populate profile update form if it exists
  const categoryEl = document.getElementById('profile-category');
  const incomeEl = document.getElementById('profile-income');
  const stateEl = document.getElementById('profile-state');
  const educationEl = document.getElementById('profile-education');

  if (categoryEl) categoryEl.value = user.category || '';
  if (incomeEl) incomeEl.value = user.income || '';
  if (stateEl) stateEl.value = user.state || '';
  if (educationEl) educationEl.value = user.education || '';
}

function setupProfileUpdate() {
  const form = document.getElementById('profile-update-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    user.category = document.getElementById('profile-category').value;
    user.income = document.getElementById('profile-income').value;
    user.state = document.getElementById('profile-state').value;
    user.education = document.getElementById('profile-education').value;

    localStorage.setItem('currentUser', JSON.stringify(user));

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem('users', JSON.stringify(users));
    }

    const successEl = document.getElementById('profile-update-success');
    if (successEl) {
      successEl.style.display = 'block';
      setTimeout(() => successEl.style.display = 'none', 3000);
    }
  });
}

function renderRecommendedSection() {
  const user = getCurrentUser();
  const container = document.getElementById('recommended-scholarships');
  const section = document.getElementById('recommended-section');
  
  if (!user || !container || !section) return;

  const recommended = getRecommendedScholarships(user, allScholarships);
  
  if (recommended.length > 0) {
    section.style.display = 'block';
    renderScholarships(recommended, container);
    
    // Highlight the very best one with AI label after rendering
    const topChoice = recommended[0];
    const topCard = container.querySelector(`.card:first-child`);
    if (topCard && topChoice.matchScore > 80) {
      topCard.insertAdjacentHTML('afterbegin', `<span class="best-choice-badge">Recommended for you ⭐</span>`);
      // Add reason below title
      const title = topCard.querySelector('h3');
      const reasonPlaceholder = document.createElement('div');
      reasonPlaceholder.id = `ai-best-reason-${topChoice.id}`;
      reasonPlaceholder.style.fontSize = '0.75rem';
      reasonPlaceholder.style.color = '#10b981';
      reasonPlaceholder.style.marginBottom = '10px';
      reasonPlaceholder.className = 'ai-loading';
      reasonPlaceholder.textContent = 'Analyzing best choice...';
      title.after(reasonPlaceholder);
      
      generateBestChoice(recommended, user).then(res => {
        reasonPlaceholder.classList.remove('ai-loading');
        reasonPlaceholder.textContent = res;
      });
    }
  } else {
    section.style.display = 'none';
  }
}

function triggerPriorityMessage(scholarship, score, daysRem) {
  const container = document.getElementById(`ai-priority-${scholarship.id}`);
  if (!container) return;

  generatePriorityMessage(scholarship, score, daysRem).then(result => {
    container.textContent = result;
  });
}

function checkDeadlineAlerts() {
  const user = getCurrentUser();
  const alertContainer = document.getElementById('deadline-alerts');
  if (!user || !alertContainer) return;

  const savedIds = user.savedScholarships || [];
  const savedScholarships = allScholarships.filter(s => {
    const id = typeof s === 'string' ? s : s.id;
    return savedIds.some(item => (typeof item === 'string' ? item === id : item.id === id));
  });

  const closingSoon = savedScholarships.filter(s => {
    const status = getDeadlineStatus(s.application_end);
    return status.daysRem !== null && status.daysRem >= 0 && status.daysRem <= 3;
  });

  if (closingSoon.length > 0) {
    alertContainer.style.display = 'block';
    alertContainer.innerHTML = `
      <div class="dashboard-alert">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p>Attention: You have <span>${closingSoon.length} scholarship(s)</span> closing soon! Apply before they expire.</p>
      </div>
    `;
  } else {
    alertContainer.style.display = 'none';
  }
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

  const savedScholarships = allScholarships.filter(s => 
    savedIds.some(item => (typeof item === 'string' ? item === s.id : item.id === s.id))
  );

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
      `Income Limit: Rs. ${formatCurrency(s.income_limit.value)} (${s.income_limit.note})`,
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
  // Modal Close Buttons
  const closeBtnModal = document.getElementById('compare-modal-close');
  const closeBtnModalBottom = document.getElementById('compare-modal-close-btn');
  if (closeBtnModal) closeBtnModal.addEventListener('click', closeCompareModal);
  if (closeBtnModalBottom) closeBtnModalBottom.addEventListener('click', closeCompareModal);

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

  // Live Search Listeners
  if (filterElements.search) {
    filterElements.search.addEventListener('input', () => {
      applyFilters(filterElements);
    });
  }
  if (sidebarFilterElements.search) {
    sidebarFilterElements.search.addEventListener('input', () => {
      applyFilters(sidebarFilterElements);
    });
  }

  // Copy link functionality in modal (delegate or direct)
  const copyBtn = document.getElementById('modal-copy-link-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (this.dataset.url) {
        copyLink(this.dataset.url, this);
      }
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

    // Compare button
    if (e.target.classList.contains('btn-compare')) {
      const id = e.target.dataset.id;
      toggleCompare(id);
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-toggle')) {
      const id = e.target.dataset.id;
      const status = e.target.value;
      updateScholarshipStatus(id, status);
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