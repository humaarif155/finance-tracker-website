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
    const lineChartCanvas = document.getElementById('incomeExpensesLineChart');
    const noLineChartDataMsg = document.getElementById('no-line-chart-data');
    const timeframeSelect = document.getElementById('timeframe-select');
    const logoutBtn = document.getElementById('logout-btn-stats'); // Get stats page logout button
    const expenseBreakdownCanvas = document.getElementById("expenseBreakdownChart");
    const pieChartCanvas = document.getElementById('expensePieChart');

    // --- Data Retrieval ---
    let transactions = [];
    try {
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
            type: 'bar',
            data: {
                labels: ['Total Income', 'Total Expenses', 'Savings'],
                datasets: [{
                    label: 'Amount (£)',
                    data: [totalIncome, totalExpenses, savings],
                    backgroundColor: ['#4DDA73', '#FF0000', '#E6CF4F'],
                    borderColor: ['#36a154', '#cc0000', '#bfae3f'],
                    borderWidth: 1,
                    borderRadius: 10,
                    barPercentage: 0.7,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '£' + value.toLocaleString('en-GB');
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
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

    // --- Line Chart Rendering ---
    const incomeExpensesData = {
        weekly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Income',
                    data: [200, 300, 250, 400],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                },
                {
                    label: 'Expenses',
                    data: [150, 200, 180, 220],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                },
            ],
        },
        monthly: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June'],
            datasets: [
                {
                    label: 'Income',
                    data: [500, 700, 800, 600, 900, 1000],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                },
                {
                    label: 'Expenses',
                    data: [400, 500, 600, 700, 800, 850],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                },
            ],
        },
        yearly: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [
                {
                    label: 'Income',
                    data: [6000, 7200, 8000, 8500, 9000, 9500],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                },
                {
                    label: 'Expenses',
                    data: [5000, 6000, 7000, 7500, 8000, 8500],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                },
            ],
        },
    };

    let currentLineChart;

    function renderLineChart(timeframe) {
        if (!lineChartCanvas) {
            console.error("Canvas element not found");
            return;
        }

        const ctx = lineChartCanvas.getContext('2d');
        if (currentLineChart) {
            currentLineChart.destroy(); // Destroy the previous chart instance
        }

        currentLineChart = new Chart(ctx, {
            type: 'line',
            data: incomeExpensesData[timeframe],
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Timeframe',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount (£)',
                        },
                    },
                },
            },
        });
    }

    function renderExpenseBreakdownChart() {
        if (!expenseBreakdownCanvas) {
            console.error("Canvas element not found");
            return;
        }

        const ctx = expenseBreakdownCanvas.getContext("2d");

        // Retrieve expense data from local storage or initialize it
        const storedData = JSON.parse(localStorage.getItem("expenseData")) || {
            labels: ["Rent", "Groceries", "Utilities", "Entertainment", "Other"],
            datasets: [
                {
                    data: [0, 0, 0, 0, 0], // Initialize with zero values
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                    hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                },
            ],
        };

        // Create the pie chart
        const expenseBreakdownChart = new Chart(ctx, {
            type: "pie",
            data: storedData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                },
            },
        });

        // Update the chart when data changes in local storage
        window.addEventListener("storage", function () {
            const updatedData = JSON.parse(localStorage.getItem("expenseData"));
            if (updatedData) {
                expenseBreakdownChart.data = updatedData;
                expenseBreakdownChart.update();
            }
        });

        // Add expense button functionality
        document.getElementById("add-expense-btn").addEventListener("click", function () {
            const amount = parseFloat(document.getElementById("expense-amount").value);
            const category = document.getElementById("expense-category").value;

            if (!amount || !category) {
                alert("Please enter a valid amount and select a category.");
                return;
            }

            // Update the chart data
            const categoryIndex = storedData.labels.indexOf(category);
            if (categoryIndex === -1) {
                // Add new category
                storedData.labels.push(category);
                storedData.datasets[0].data.push(amount);
            } else {
                // Update existing category
                storedData.datasets[0].data[categoryIndex] += amount;
            }

            // Update the chart
            expenseBreakdownChart.update();

            // Save updated data to local storage
            localStorage.setItem("expenseData", JSON.stringify(storedData));

            // Clear input fields
            document.getElementById("expense-amount").value = "";
            document.getElementById("expense-category").value = "";
        });
    }

    // Initialize the pie chart
    let expensePieChartInstance;

    // Function to calculate expenses grouped by category
    function calculateExpensesByCategory() {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, transaction) => {
                const category = transaction.category || 'Other';
                acc[category] = (acc[category] || 0) + transaction.amount;
                return acc;
            }, {});
    }

    // Function to render the pie chart
    function renderPieChart() {
        if (!pieChartCanvas) return; // Exit if canvas element doesn't exist
        const ctx = pieChartCanvas.getContext('2d');
        const expensesByCategory = calculateExpensesByCategory();
        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);

        if (expensePieChartInstance) {
            expensePieChartInstance.destroy(); // Destroy the existing chart before re-rendering
        }

        if (categories.length === 0) {
            pieChartCanvas.style.display = 'none';
            document.getElementById('no-pie-chart-data').style.display = 'block';
            return;
        } else {
            pieChartCanvas.style.display = 'block';
            document.getElementById('no-pie-chart-data').style.display = 'none';
        }

        const backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
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
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) { label += `$${context.parsed}`; }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Example data for savings and budget (replace with real data from your backend or calculations)
    const savingsPercentage = 50; // Example: 50% of savings goal achieved
    const budgetPercentage = 70; // Example: 70% of budget used

    // Update Savings Progress
    const savingsProgress = document.getElementById('savings-progress');
    const savingsPercentageText = document.getElementById('savings-percentage');
    savingsProgress.value = savingsPercentage;
    savingsPercentageText.textContent = `${savingsPercentage}%`;

    // Update Budget Progress
    const budgetProgress = document.getElementById('budget-progress');
    const budgetPercentageText = document.getElementById('budget-percentage');
    budgetProgress.value = budgetPercentage;
    budgetPercentageText.textContent = `${budgetPercentage}%`;

    // --- Event Listeners ---
    if (timeframeSelect) {
        timeframeSelect.addEventListener('change', (event) => {
            const selectedTimeframe = event.target.value;
            renderLineChart(selectedTimeframe);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('transactions');
            window.location.href = 'login.html';
        });
    }

    // --- Initial Render ---
    renderSummaryBarChart();
    renderLineChart('monthly'); // Default to monthly data
    renderExpenseBreakdownChart();
    renderPieChart();
});