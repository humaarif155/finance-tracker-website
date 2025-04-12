document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    // Redirect to login if user is not logged in
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return; // Stop script execution
    }

    // --- DOM Elements ---
    const barChartCanvas = document.getElementById('summaryBarChart');
    const noChartDataMsg = document.getElementById('no-chart-data');
    const logoutBtn = document.getElementById('logout-btn-stats'); // Get stats page logout button

    // --- Data Retrieval ---
    // Access the globally defined transactions variable if available,
    // otherwise retrieve from localStorage as a fallback.
    let transactions = [];
    try {
        // Attempt to retrieve from localStorage first, as it's more reliable across pages
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    } catch (e) {
        console.error("Error parsing transactions from localStorage", e);
        transactions = []; // Default to empty array on error
    }


    // --- Chart Rendering Function ---
    function renderSummaryBarChart() {
        if (!barChartCanvas) {
            console.error("Canvas element not found");
            return; // Exit if canvas doesn't exist
        }

        const ctx = barChartCanvas.getContext('2d');

        // Calculate Metrics
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const savings = totalIncome - totalExpenses;

        // Check for data
        if (transactions.length === 0 || (totalIncome === 0 && totalExpenses === 0)) {
            barChartCanvas.style.display = 'none';
            noChartDataMsg.style.display = 'block';
            return;
        } else {
            barChartCanvas.style.display = 'block';
            noChartDataMsg.style.display = 'none';
        }

        // Chart Configuration
        new Chart(ctx, {
            type: 'bar', // Bar chart
            data: {
                labels: ['Total Income', 'Total Expenses', 'Savings'],
                datasets: [{
                    label: 'Amount (£)', // Label for the dataset
                    data: [totalIncome, totalExpenses, savings],
                    backgroundColor: [
                        '#4DDA73', // Income color
                        '#FF0000', // Expense color
                        '#E6CF4F'  // Savings color
                    ],
                    borderColor: [ // Optional: Add borders
                        '#36a154',
                        '#cc0000',
                        '#bfae3f'
                    ],
                    borderWidth: 1,
                    // --- Add these properties ---
                    borderRadius: 10,       // Makes corners rounded (adjust value as needed)
                    barPercentage: 0.7,     // Makes bars thinner (value between 0 and 1)
                    // ---------------------------
                }]
            },
            options: {
                indexAxis: 'y', // Make the bars horizontal
                responsive: true,
                maintainAspectRatio: false, // Allow chart to fill container height better
                scales: {
                    x: { // The value axis (horizontal in this case)
                        beginAtZero: true,
                        ticks: {
                            // Optional: Format ticks as currency
                            callback: function(value, index, values) {
                                return '£' + value.toLocaleString('en-GB');
                            }
                        }
                    },
                    y: { // The category axis (vertical in this case)
                        grid: {
                            display: false // Hide vertical grid lines if desired
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // Hide legend as labels are clear
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    // Format tooltip value as currency
                                    label += new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(context.parsed.x);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Logout Functionality (Optional for this page) ---
     function logout() {
        console.log('Logging out from stats page...');
        // Clear relevant localStorage items
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userFirstName');
        localStorage.removeItem('transactions');
        // Redirect to login page
        window.location.href = 'login.html';
    }

    // --- Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // --- Initial Render ---
    renderSummaryBarChart();

}); // End DOMContentLoaded
