document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // --- Login Simulation ---
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent actual form submission

            // --- !!! ---
            // In a REAL app, you would send the email/password
            // to your backend server here using fetch()
            // and wait for a success response. The backend would verify credentials.
            // The backend might also return the user's first name here.
            // --- !!! ---

            console.log('Simulating successful login...');

            // Simulate success: Set a flag in localStorage
            localStorage.setItem('isLoggedIn', 'true'); // Simple flag

            // **Important**: In a real app, if the backend provides the first name on login,
            // you would store it here as well, potentially overwriting the signup one
            // if it changed. Example:
            // const firstNameFromBackend = "User"; // Replace with actual data from backend
            // localStorage.setItem('userFirstName', firstNameFromBackend);

            // Redirect to the main application page
            window.location.href = 'index.html';
        });
    }

    // --- Signup Simulation ---
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent actual form submission

            const termsCheckbox = document.getElementById('terms');
            const firstNameInput = document.getElementById('first-name'); // Get first name input

            if (!termsCheckbox.checked) {
                alert('Please agree to the Terms and Privacy Policy.');
                return; // Stop submission if terms not agreed
            }

            // Get and validate first name
            const firstName = firstNameInput.value.trim();
            if (!firstName) {
                alert('Please enter your first name.');
                return; // Stop if first name is empty
            }

             // --- !!! ---
            // In a REAL app, you would send the user details
            // (name, email, password) to your backend server
            // here using fetch() for registration.
            // --- !!! ---

            console.log('Simulating successful signup...');

            // Simulate success: Store first name and set login flag
            localStorage.setItem('userFirstName', firstName); // Store the first name
            localStorage.setItem('isLoggedIn', 'true'); // Simple flag (auto-login after signup)

            // Redirect to the main application page
            window.location.href = 'index.html';
        });
    }
});
