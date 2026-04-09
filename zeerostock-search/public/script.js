// Global state
let allInventory = [];
let categories = new Set();

// DOM elements
const form = document.getElementById('searchForm');
const qInput = document.getElementById('q');
const categorySelect = document.getElementById('category');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const clearBtn = document.getElementById('clearBtn');
const errorMsg = document.getElementById('errorMsg');
const resultsInfo = document.getElementById('resultsInfo');
const resultsTable = document.getElementById('resultsTable');
const resultsBody = document.getElementById('resultsBody');
const noResults = document.getElementById('noResults');

// Load initial data and categories
async function loadData() {
  try {
    const res = await fetch('/search');
    const data = await res.json();
    allInventory = data.results || [];
    
    // Extract unique categories
    categories = new Set(allInventory.map(item => item.category));
    populateCategories();
    
    // Show all initially
    displayResults(allInventory, data.count || 0);
  } catch (err) {
    console.error('Load error:', err);
    showError('Server not running? Run `npm start` first. Showing demo data.');
    // Fallback demo
    allInventory = [
      {id:1,name:'Demo Laptop',category:'electronics',price:999,description:'Demo item'}
    ];
    categories.add('electronics');
    populateCategories();
    displayResults(allInventory, 1);
  }
}

// Populate category dropdown
function populateCategories() {
  Array.from(categories).sort().forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categorySelect.appendChild(option);
  });
}

// Build query params
function buildQuery() {
  const params = new URLSearchParams();
  if (qInput.value.trim()) params.set('q', qInput.value.trim());
  if (categorySelect.value) params.set('category', categorySelect.value);
  const minP = parseFloat(minPriceInput.value);
  const maxP = parseFloat(maxPriceInput.value);
  if (!isNaN(minP)) params.set('minPrice', minP);
  if (!isNaN(maxP)) params.set('maxPrice', maxP);
  return params.toString();
}

// Perform search
async function performSearch() {
  const query = buildQuery();
  const url = query ? `/search?${query}` : '/search';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // Validate price range
    const minP = parseFloat(minPriceInput.value);
    const maxP = parseFloat(maxPriceInput.value);
    if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
      showError('Min price cannot be greater than max price');
      hideResults();
      return;
    }
    
    displayResults(data.results, data.count, data.filters);
  } catch (err) {
    showError('Search failed');
  }
}

// Display results
function displayResults(results, count, filters = {}) {
  hideError();
  hideNoResults();
  
  if (results.length === 0) {
    showNoResults();
    return;
  }
  
  resultsBody.innerHTML = '';
  results.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>${escapeHtml(item.description)}</td>
    `;
    resultsBody.appendChild(row);
  });
  
  resultsTable.classList.remove('hidden');
  resultsInfo.classList.remove('hidden');
  resultsInfo.textContent = `Found ${count} results ${Object.entries(filters).filter(([k,v]) => v).length > 0 ? '(filtered)' : '(all)'}`;
}

// Utility functions
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function showNoResults() {
  noResults.classList.remove('hidden');
  resultsInfo.classList.add('hidden');
}

function hideNoResults() {
  noResults.classList.add('hidden');
}

function hideResults() {
  resultsTable.classList.add('hidden');
  resultsInfo.classList.add('hidden');
  noResults.classList.add('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function clearForm() {
  qInput.value = '';
  categorySelect.value = '';
  minPriceInput.value = '';
  maxPriceInput.value = '';
  hideError();
  displayResults(allInventory, allInventory.length);
}

// Event listeners
form.addEventListener('submit', e => {
  e.preventDefault();
  performSearch();
});

clearBtn.addEventListener('click', clearForm);

// Real-time search on input (debounced)
let timeout;
function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(performSearch, 300);
}

qInput.addEventListener('input', debounceSearch);
categorySelect.addEventListener('change', debounceSearch);
minPriceInput.addEventListener('input', debounceSearch);
maxPriceInput.addEventListener('input', debounceSearch);

// Init
loadData();
