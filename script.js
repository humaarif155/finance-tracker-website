document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return; // Stop further execution
    }

    // --- DOM Elements ---
    const bodyEl = document.body; // Get body element
    const rightSidebar = document.getElementById('right-sidebar'); // Get right sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const welcomeElement = document.getElementById('welcome-message');
    const incomeAmountInput = document.getElementById('income-amount');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseCategorySelect = document.getElementById('expense-category');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const balanceEl = document.getElementById('balance');
    const activityList = document.getElementById('activity-list');
    const statsList = document.getElementById('stats-list'); // For potential use in #statistics section
    const resetDataBtn = document.getElementById('reset-data-btn');
    const logoutBtn = document.getElementById('logout-btn'); // Main logout button in left nav
    const pieChartCanvas = document.getElementById('expensePieChart');
    const noChartDataMsg = document.getElementById('no-chart-data');
    const savingGoalsList = document.getElementById('saving-goals-list');

    // --- Data Storage & Chart Instance ---
    // Define transactions globally within the scope of this script
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let expensePieChartInstance = null;
    const savingGoals = [];

    // --- Functions ---

    // Function to toggle Right Sidebar Visibility
    function toggleRightSidebar(show) {
        // Check if the sidebar should be visible based on screen width first
        // (Using 1200px breakpoint from CSS)
        const shouldBeVisibleBasedOnWidth = window.innerWidth > 1200;

        if (show && shouldBeVisibleBasedOnWidth) {
            if (rightSidebar) rightSidebar.classList.remove('hidden'); // Check if sidebar exists
            bodyEl.style.paddingRight = '280px'; // Use the actual width
        } else {
            // Hide if 'show' is false OR if screen is too narrow
            if (rightSidebar) rightSidebar.classList.add('hidden'); // Check if sidebar exists
            bodyEl.style.paddingRight = '0px';
        }
    }

    // Format number as currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    }

    // Update summary boxes
    function updateSummary() {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;

        // Check if elements exist before updating
        if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);
        if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(expenses);
        if (balanceEl) {
            balanceEl.textContent = formatCurrency(balance);
            balanceEl.style.color = balance >= 0 ? '#27ae60' : '#c0392b';
            // Optional: change border color of balance box
            const balanceBox = balanceEl.closest('.summary-box');
            if (balanceBox) {
                balanceBox.style.borderColor = balance >= 0 ? '#C2F5C6' : '#FFD2D2';
            }
        }
    }

    // Add transaction item to DOM (Activity List on Dashboard)
    function addTransactionToDOM(transaction) {
        if (!activityList) return; // Don't run if activity list isn't on the page

        const item = document.createElement('li');
        item.classList.add(transaction.type);

        const descriptionSpan = document.createElement('span');
        descriptionSpan.classList.add('description');
        descriptionSpan.textContent = transaction.type === 'income' ? 'Income' : transaction.category;

        const amountSpan = document.createElement('span');
        amountSpan.classList.add('amount');
        amountSpan.textContent = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}`;

        item.appendChild(descriptionSpan);
        item.appendChild(amountSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.setAttribute('aria-label', 'Delete transaction');
        deleteBtn.onclick = () => removeTransaction(transaction.id);
        item.appendChild(deleteBtn);

        activityList.insertBefore(item, activityList.firstChild);

        const placeholder = activityList.querySelector('li:only-child');
        if (placeholder && placeholder.textContent.includes('No transactions yet')) {
            placeholder.remove();
        }
    }

    // Update statistics section list (if the #statistics section is used in index.html)
    function updateStatistics() {
        if (!statsList) return; // Exit if stats list element doesn't exist

        statsList.innerHTML = '';
        const expensesByCategory = calculateExpensesByCategory();
        if (Object.keys(expensesByCategory).length === 0) {
            statsList.innerHTML = '<li>No expense data for statistics yet.</li>';
            return;
        }
        const sortedCategories = Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a);
        sortedCategories.forEach(([category, amount]) => {
            const li = document.createElement('li');
            li.textContent = `${category}: ${formatCurrency(amount)}`;
            statsList.appendChild(li);
        });
    }

    // Calculate expenses grouped by category
    function calculateExpensesByCategory() {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, transaction) => {
                const category = transaction.category || 'Other';
                acc[category] = (acc[category] || 0) + transaction.amount;
                return acc;
            }, {});
    }

    // Render Pie Chart Function (Only if canvas exists)
    function renderPieChart() {
        if (!pieChartCanvas) return; // Exit if canvas element doesn't exist
        const ctx = pieChartCanvas.getContext('2d');
        const expensesByCategory = calculateExpensesByCategory();
        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);

        if (expensePieChartInstance) {
            expensePieChartInstance.destroy();
        }

        if (categories.length === 0) {
            pieChartCanvas.style.display = 'none';
            if (noChartDataMsg) noChartDataMsg.style.display = 'block'; // Check if msg element exists
            return;
        } else {
            pieChartCanvas.style.display = 'block';
            if (noChartDataMsg) noChartDataMsg.style.display = 'none'; // Check if msg element exists
        }

        const backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#C9CBCF', '#3FC77D', '#F07B3F', '#6A0DAD', '#FFD700'];
        const hoverBackgroundColors = backgroundColors.map(color => `${color}B3`);

        expensePieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Expenses by Category',
                    data: amounts,
                    backgroundColor: backgroundColors.slice(0, categories.length),
                    hoverBackgroundColor: hoverBackgroundColors.slice(0, categories.length),
                    borderWidth: 1,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top', },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) { label += formatCurrency(context.parsed); }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Add new transaction
    function addTransaction(type, amount, category = null) {
        const numericAmount = +amount;
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Please enter a valid positive amount.');
            return false;
        }
        if (type === 'expense' && !category) {
            alert('Please select a category for the expense.');
            return false;
        }
        const newTransaction = {
            id: generateID(), type, amount: numericAmount,
            category: type === 'expense' ? category : null,
            timestamp: new Date().toISOString()
        };
        transactions.push(newTransaction);
        saveTransactions();
        init(); // Re-initialize display (updates summary, activity list, and chart)
        renderPieChart(); // Ensure the pie chart is updated
        clearInputs(type);
        return true;
    }

    // Remove transaction by ID
    function removeTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        init(); // Re-initialize display
    }

    // Generate unique ID
    function generateID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Save transactions to Local Storage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Clear input fields
    function clearInputs(type) {
        if (type === 'income' && incomeAmountInput) {
            incomeAmountInput.value = '';
        } else if (type === 'expense') {
            if (expenseAmountInput) expenseAmountInput.value = '';
            if (expenseCategorySelect) expenseCategorySelect.selectedIndex = 0; // Reset dropdown
        }
    }

    // Handle Navigation Clicks (Handles internal and external links)
    function handleNavClick(event) {
        // Find the clicked link
        let clickedLink = event.target.closest('a.nav-link');
        if (!clickedLink) return;

        const targetHref = clickedLink.getAttribute('href');

        // Check if it's an external page link
        if (targetHref && !targetHref.startsWith('#')) {
            // Allow default browser navigation
            // No need to preventDefault() or manage sections/sidebar here
            // Browser will navigate away
            return;
        }

        // If it's an internal link (starts with # or has no href)
        event.preventDefault(); // Prevent default for internal links ONLY

        // Update active classes for links and sections
        navLinks.forEach(link => link.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        clickedLink.classList.add('active');
        const targetId = clickedLink.getAttribute('data-target'); // Use data-target for internal sections
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Toggle Right Sidebar based on target (only for internal sections)
        toggleRightSidebar(targetId === 'dashboard');

        // Update statistics list ONLY if the target is the internal #statistics section
        if (targetId === 'statistics') {
             updateStatistics(); // Call if using the internal stats section
        }
    }

    // Reset all data
    function resetData() {
        if (confirm('Are you sure you want to reset all income and expense data? This cannot be undone.')) {
            transactions = [];
            localStorage.removeItem('transactions');
            init(); // Re-initialize display (clears lists, updates summary, updates chart)
            // Ensure placeholders are shown if lists are empty after reset
            if (activityList && activityList.children.length === 0) {
                 activityList.innerHTML = '<li>No transactions yet.</li>';
            }
             if (statsList && statsList.children.length === 0) {
                 statsList.innerHTML = '<li>No expense data for statistics yet.</li>';
            }
        }
    }

    // Logout Functionality
    function logout() {
        console.log('Logging out...');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userFirstName');
        localStorage.removeItem('transactions');
        if (expensePieChartInstance) { // Clean up chart instance
            expensePieChartInstance.destroy();
            expensePieChartInstance = null;
        }
        window.location.href = 'login.html'; // Redirect to login page
    }

    // Initialize the application
    function init() {
        // Clear activity list before repopulating (if list exists)
        if (activityList) {
            activityList.innerHTML = '';
            if (transactions.length > 0) {
                // Sort transactions by timestamp descending for display order
                const sortedTransactions = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                sortedTransactions.forEach(addTransactionToDOM);
            } else {
                activityList.innerHTML = '<li>No transactions yet.</li>';
            }
        }

        // Populate transaction history table in the activity section
        updateTransactionHistory();

        updateSummary(); // Update summary boxes (if elements exist)
        renderPieChart(); // Render/update the pie chart (if canvas exists)

        // Set Initial Sidebar State based on the initially active section
        const initialActiveSection = document.querySelector('.content-section.active');
        toggleRightSidebar(initialActiveSection && initialActiveSection.id === 'dashboard');
    }

    // --- Event Listeners ---
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => {
            addTransaction('income', incomeAmountInput.value);
        });
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            addTransaction(
                'expense',
                expenseAmountInput.value,
                expenseCategorySelect.value
            );
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetData);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Add resize listener to re-evaluate sidebar visibility
    window.addEventListener('resize', () => {
        const currentActiveSection = document.querySelector('.content-section.active');
        // Check if currentActiveSection exists before accessing id
        toggleRightSidebar(currentActiveSection && currentActiveSection.id === 'dashboard');
    });

    // --- Initial Load ---
    // Display Welcome Message
    const userFirstName = localStorage.getItem('userFirstName');
    if (welcomeElement && userFirstName) {
        welcomeElement.textContent = `Welcome, ${userFirstName}!`;
    } else if (welcomeElement) {
        welcomeElement.textContent = 'Welcome!';
    }

    init(); // Call init to load data, render chart, and set initial sidebar state

    // Add Saving Goal
    document.getElementById('add-saving-goal-btn').addEventListener('click', () => {
        const goalName = document.getElementById('saving-goal-name').value;
        const goalAmount = parseFloat(document.getElementById('saving-goal-amount').value);

        if (goalName && goalAmount > 0) {
            savingGoals.push({ name: goalName, target: goalAmount, saved: 0 });
            updateSavingGoalsUI();
        }
    });

    // Update Saving Goals UI
    function updateSavingGoalsUI() {
        savingGoalsList.innerHTML = '';
        savingGoals.forEach((goal, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${goal.name}</strong>: £${goal.saved.toFixed(2)} / £${goal.target.toFixed(2)}
                <button class="add-to-goal-btn" data-index="${index}">Add</button>
            `;
            savingGoalsList.appendChild(li);
        });

        // Add event listeners for "Add" buttons
        document.querySelectorAll('.add-to-goal-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const amount = parseFloat(prompt('Enter amount to add:'));
                if (amount > 0 && savingGoals[index].saved + amount <= savingGoals[index].target) {
                    savingGoals[index].saved += amount;

                    // Treat the contribution as an expense
                    addTransaction('expense', amount, 'Saving Goal');
                    updateSavingGoalsUI();
                }
            });
        });
    }

    // Add Transaction (already defined in your script)
    function addTransaction(type, amount, category = null) {
        const numericAmount = +amount;
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('Please enter a valid positive amount.');
            return false;
        }
        if (type === 'expense' && !category) {
            alert('Please select a category for the expense.');
            return false;
        }
        const newTransaction = {
            id: generateID(),
            type,
            amount: numericAmount,
            category: type === 'expense' ? category : null,
            timestamp: new Date().toISOString()
        };
        transactions.push(newTransaction);
        saveTransactions();
        init(); // Re-initialize display (updates summary, activity list, and chart)
        renderPieChart(); // Ensure the pie chart is updated
        return true;
    }

    // Add Saving Goal
    document.getElementById('add-saving-goal-btn').addEventListener('click', function () {
        const goalName = document.getElementById('saving-goal-name').value;
        const goalAmount = parseFloat(document.getElementById('saving-goal-amount').value);

        if (goalName && goalAmount > 0) {
            const goalList = document.getElementById('saving-goals-list');
            const newGoal = document.createElement('li');
            newGoal.classList.add('goal-item');
            newGoal.innerHTML = `
                <span class="goal-name">${goalName}</span>
                <span class="goal-progress">£0 / £${goalAmount.toFixed(2)}</span>
                <i class="fas fa-check-circle goal-completed" style="display: none;"></i>
            `;
            goalList.appendChild(newGoal);

            // Clear input fields
            document.getElementById('saving-goal-name').value = '';
            document.getElementById('saving-goal-amount').value = '';
        }
    });

    // Example: Mark a goal as completed
    function markGoalAsCompleted(goalItem) {
        const tickIcon = goalItem.querySelector('.goal-completed');
        tickIcon.style.display = 'inline';
        goalItem.style.backgroundColor = '#e8f5e9'; // Light green background
    }
});

// Array to store transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Function to add a transaction
function addTransaction(type, amount, category = null) {
    const numericAmount = +amount;
    if (isNaN(numericAmount) || numericAmount <= 0) {
        alert('Please enter a valid positive amount.');
        return false;
    }
    if (type === 'expense' && !category) {
        alert('Please select a category for the expense.');
        return false;
    }
    const newTransaction = {
        id: generateID(),
        type,
        amount: numericAmount,
        category: type === 'expense' ? category : null,
        timestamp: new Date().toISOString()
    };
    transactions.push(newTransaction);
    saveTransactions();
    init(); // Re-initialize display (updates summary, activity list, and chart)
    renderPieChart(); // Ensure the pie chart is updated
    clearInputs(type);
    return true;
}

// Function to update the transaction history table with filtering
function updateTransactionHistory() {
    const tableBody = document.querySelector("#transaction-history tbody");
    const filterType = document.getElementById("filter-type").value; // Get selected filter type
    if (!tableBody) return;

    tableBody.innerHTML = ""; // Clear existing rows

    // Filter transactions based on the selected type
    const filteredTransactions = transactions.filter(transaction => {
        return filterType === "all" || transaction.type.toLowerCase() === filterType;
    });

    filteredTransactions.forEach((transaction) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
            <td>${transaction.category || "N/A"}</td>
            <td>${transaction.type}</td>
            <td class="${transaction.type.toLowerCase()}">£${transaction.amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Event listener for filter dropdown
document.getElementById("filter-type").addEventListener("change", updateTransactionHistory);

// Event listeners for adding income and expenses
document.getElementById("add-income-btn").addEventListener("click", () => {
    const incomeAmount = document.getElementById("income-amount").value;
    if (incomeAmount && incomeAmount > 0) {
        addTransaction("Income", incomeAmount);
        document.getElementById("income-amount").value = ""; // Clear input
    }
});

document.getElementById("add-expense-btn").addEventListener("click", () => {
    const expenseAmount = document.getElementById("expense-amount").value;
    const expenseCategory = document.getElementById("expense-category").value;
    if (expenseAmount && expenseAmount > 0 && expenseCategory) {
        addTransaction("Expense", expenseAmount, expenseCategory);
        document.getElementById("expense-amount").value = ""; // Clear input
        document.getElementById("expense-category").value = ""; // Reset dropdown
    }
});

addIncomeBtn.addEventListener("click", () => {
    const incomeAmount = incomeAmountInput.value;
    if (incomeAmount && incomeAmount > 0) {
        addTransaction("income", incomeAmount);
        saveTransactions();
        updateTransactionHistory();
        incomeAmountInput.value = ""; // Clear input
    }
});

addExpenseBtn.addEventListener("click", () => {
    const expenseAmount = expenseAmountInput.value;
    const expenseCategory = expenseCategorySelect.value;
    if (expenseAmount && expenseAmount > 0 && expenseCategory) {
        addTransaction("expense", expenseAmount, expenseCategory);
        renderPieChart(); // Ensure the pie chart is updated
        saveTransactions();
        updateTransactionHistory();
        expenseAmountInput.value = ""; // Clear input
        expenseCategorySelect.value = ""; // Reset dropdown
    }
});

// Handle currency change
document.getElementById("currency-select").addEventListener("change", (event) => {
    const selectedCurrency = event.target.value;
    localStorage.setItem("currency", selectedCurrency); // Save currency to localStorage
    alert(`Currency changed to ${selectedCurrency}`);
});

// Handle adding new categories
document.getElementById("add-category-btn").addEventListener("click", () => {
    const newCategoryInput = document.getElementById("new-category");
    const newCategory = newCategoryInput.value.trim();

    if (newCategory) {
        const categoriesList = document.getElementById("categories-list");
        const newCategoryItem = document.createElement("li");
        newCategoryItem.textContent = newCategory;
        categoriesList.appendChild(newCategoryItem);

        newCategoryInput.value = ""; // Clear input field
    } else {
        alert("Please enter a valid category name.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savingGoals = [];
    const activityList = document.getElementById('activity-list');
    const savingGoalsList = document.getElementById('saving-goals-list');

    // Add Saving Goal
    document.getElementById('add-saving-goal-btn').addEventListener('click', () => {
        const goalName = document.getElementById('saving-goal-name').value;
        const goalAmount = parseFloat(document.getElementById('saving-goal-amount').value);

        if (goalName && goalAmount > 0) {
            savingGoals.push({ name: goalName, target: goalAmount, saved: 0 });
            updateSavingGoalsUI();
        }
    });

    // Update Saving Goals UI
    function updateSavingGoalsUI() {
        savingGoalsList.innerHTML = '';
        savingGoals.forEach((goal, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${goal.name}</strong>: £${goal.saved.toFixed(2)} / £${goal.target.toFixed(2)}
                <button class="add-to-goal-btn" data-index="${index}">Add</button>
            `;
            savingGoalsList.appendChild(li);
        });

        // Add event listeners for "Add" buttons
        document.querySelectorAll('.add-to-goal-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const amount = parseFloat(prompt('Enter amount to add:'));
                if (amount > 0 && savingGoals[index].saved + amount <= savingGoals[index].target) {
                    savingGoals[index].saved += amount;
                    addActivity('Saving Goal', 'Contribution', amount, savingGoals[index].name);
                    updateSavingGoalsUI();
                }
            });
        });
    }

    // Add Activity
    function addActivity(category, type, amount, goalName = '') {
        const date = new Date().toLocaleDateString();
        const li = document.createElement('li');
        li.textContent = `${date} - ${category} - ${type} - £${amount.toFixed(2)} ${goalName ? `(${goalName})` : ''}`;
        activityList.appendChild(li);

        // Update Activity Table
        const tbody = document.querySelector('#transaction-history tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${date}</td>
            <td>${category}</td>
            <td>${type}</td>
            <td>£${amount.toFixed(2)}</td>
            <td>${goalName}</td>
        `;
        tbody.appendChild(tr);
    }
});