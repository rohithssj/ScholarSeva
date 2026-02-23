/**
 * ScholarSeva - Scholarship Aggregator
 * Premium Vanilla JavaScript - No Framework
 * 
 * Key Features:
 * - Dynamic scholarship loading from JSON
 * - Modal-based detailed view
 * - Advanced filtering system
 * - Responsive design
 */

// ========================================
// STATE MANAGEMENT
// ========================================

let allScholarships = [];
let filteredScholarships = [];
let currentPage = 'home'; // 'home' or 'scholarships'

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

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadScholarships();
  initializePage();
  setupEventListeners();
});

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
  // Detect which page we're on
  if (homeScholarships) {
    currentPage = 'home';
    populateStateDropdown('filter-state');
    displayHomeScholarships();
  } else if (scholarshipsGrid) {
    currentPage = 'scholarships';
    populateStateDropdown('filter-state');
    populateStateDropdown('sidebar-state');
    displayAllScholarships();
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
  card.innerHTML = `
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



function setupEventListeners() {
  // Modal close buttons
  modalCloseBtn.addEventListener('click', closeModal);
  modalCloseBtnBottom.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
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
  });
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

// display(scholarships)