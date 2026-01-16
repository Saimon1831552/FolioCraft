// Define FAQ toggle in the global scope so inline onclick can find it
function toggleFaq(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('[data-lucide="chevron-down"]');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('bg-dark-950/95', 'shadow-lg', 'border-white/10');
                navbar.classList.remove('bg-dark-950/80', 'border-white/5');
            } else {
                navbar.classList.remove('bg-dark-950/95', 'shadow-lg', 'border-white/10');
                navbar.classList.add('bg-dark-950/80', 'border-white/5');
            }
        });
    }

    // 3. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    // 4. Modal Logic
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const forgotModal = document.getElementById('forgot-modal'); // Added Forgot Modal

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    
    const loginModalClose = document.getElementById('login-modal-close');
    const registerModalClose = document.getElementById('register-modal-close');
    const forgotModalClose = document.getElementById('forgot-modal-close'); // Added

    const loginToRegisterBtn = document.getElementById('login-to-register-btn');
    const registerToLoginBtn = document.getElementById('register-to-login-btn');

    // Link in Login modal to open Forgot Password
    const forgotPasswordLink = document.getElementById('forgot-password-link'); 
    // Link in Forgot modal to go back to Login
    const forgotToLoginBtn = document.getElementById('forgot-to-login-btn');

    const allUseTemplateBtns = document.querySelectorAll('.use-template-btn');

    const openModal = (modal) => modal && modal.classList.add('open');
    const closeModal = (modal) => modal && modal.classList.remove('open');

    // Open Buttons
    loginBtn?.addEventListener('click', () => openModal(loginModal));
    registerBtn?.addEventListener('click', () => openModal(registerModal));

    // Close Buttons
    loginModalClose?.addEventListener('click', () => closeModal(loginModal));
    registerModalClose?.addEventListener('click', () => closeModal(registerModal));
    forgotModalClose?.addEventListener('click', () => closeModal(forgotModal));

    // Switch Modal Links
    loginToRegisterBtn?.addEventListener('click', () => {
        closeModal(loginModal);
        openModal(registerModal);
    });

    registerToLoginBtn?.addEventListener('click', () => {
        closeModal(registerModal);
        openModal(loginModal);
    });

    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(forgotModal);
    });

    forgotToLoginBtn?.addEventListener('click', () => {
        closeModal(forgotModal);
        openModal(loginModal);
    });

    // Template Buttons (Open Register)
    allUseTemplateBtns.forEach(btn => {
        btn.addEventListener('click', () => openModal(registerModal));
    });

    // Close modal on outside click
    [loginModal, registerModal, forgotModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // 5. Form Validation & API Connection
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');

    const showError = (id, message) => {
        const el = document.getElementById(id);
        if (el) el.textContent = message;
    };
    const clearError = (id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    };
    const clearAllErrors = (form) => {
        form?.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    }

    // --- LOGIN FORM SUBMIT ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors(loginForm);
        let isValid = true;
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('login-error', 'Please enter a valid email.');
            isValid = false;
        } else if (password.trim() === '') {
            showError('login-error', 'Please enter your password.');
            isValid = false;
        }

        if (isValid) {
            const errorEl = document.getElementById('login-error');
            errorEl.textContent = 'Logging in...';
            errorEl.style.color = '#38bdf8'; // loading blue

            try {
                const response = await fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    errorEl.textContent = 'Success! Redirecting...';
                    errorEl.style.color = '#4ade80'; // Green
                    
                    // FIXED: Access user data correctly via data.data.user
                    // The API returns { success: true, data: { user: {...} } }
                    const userData = data.data.user;

                    // Store user session for the frontend
                    localStorage.setItem('foliocraft_user', JSON.stringify(userData));

                    setTimeout(() => {
                        // FIXED: Check role on userData, not data.user
                        if (userData.role === 'admin') {
                            window.location.href = 'admin_dashboard.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    errorEl.style.color = '#f87171'; // Red
                    errorEl.textContent = data.error || 'Login failed.';
                }
            } catch (err) {
                console.error(err);
                errorEl.style.color = '#f87171';
                errorEl.textContent = 'Server error. Please try again.';
            }
        }
    });

    // --- REGISTER FORM SUBMIT ---
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors(registerForm);
        let isValid = true;
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (name.trim() === '') { showError('reg-name-error', 'Name is required.'); isValid = false; }
        if (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('reg-email-error', 'Please enter a valid email.'); isValid = false; }
        if (password.length < 8) { showError('reg-password-error', 'Password must be at least 8 characters.'); isValid = false; }
        if (password !== confirmPassword) { showError('reg-confirm-password-error', 'Passwords do not match.'); isValid = false; }

        if (isValid) {
            try {
                const response = await fetch('api.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: name, email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Switch to login modal
                    closeModal(registerModal);
                    openModal(loginModal);
                    
                    // Prefill email
                    document.getElementById('login-email').value = email;
                    
                    const loginError = document.getElementById('login-error');
                    loginError.textContent = 'Account created! Please log in.';
                    loginError.style.color = '#4ade80'; // Green

                    registerForm.reset();
                } else {
                    // Register response error is at top level in API
                    alert(data.error || 'Registration failed');
                }
            } catch (err) {
                console.error(err);
                alert('Server error. Please try again.');
            }
        }
    });

    // --- FORGOT PASSWORD SUBMIT ---
    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('forgot-message');
        const email = document.getElementById('forgot-email').value;

        // Reset message style
        msgEl.textContent = '';
        msgEl.style.color = '';

        if (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            msgEl.textContent = 'Please enter a valid email.';
            msgEl.style.color = '#f87171'; // Red
            return;
        }

        msgEl.textContent = 'Sending...';
        msgEl.style.color = '#38bdf8'; // Blue

        try {
            const response = await fetch('api.php?action=forgot_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                // Success message is inside data object for this endpoint
                msgEl.textContent = data.data.message;
                msgEl.style.color = '#4ade80'; // Green
                forgotForm.reset();
            } else {
                msgEl.textContent = data.error || 'Request failed.';
                msgEl.style.color = '#f87171';
            }
        } catch (err) {
            console.error(err);
            msgEl.textContent = 'Server error. Please try again.';
            msgEl.style.color = '#f87171';
        }
    });

    // 6. Carousel Logic
    const carouselInner = document.getElementById('carousel-inner');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (carouselInner && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;
        let autoPlayInterval;

        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('w-2.5', 'h-2.5', 'rounded-full', 'transition-all', 'duration-300');
            dot.classList.add(i === 0 ? 'bg-brand-500' : 'bg-gray-600', 'hover:bg-brand-400');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
        const dots = dotsContainer.querySelectorAll('button');

        function updateCarousel() {
            carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('bg-brand-500', index === currentIndex);
                dot.classList.toggle('bg-gray-600', index !== currentIndex);
            });
        }

        function goToSlide(index) {
            currentIndex = index;
            updateCarousel();
            resetAutoPlay();
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }

        function startAutoPlay() {
            autoPlayInterval = setInterval(nextSlide, 5000); // 5 seconds
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        nextBtn?.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });

        prevBtn?.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });

        // Pause on hover
        const carouselWrapper = document.getElementById('carousel-wrapper');
        carouselWrapper?.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselWrapper?.addEventListener('mouseleave', startAutoPlay);

        startAutoPlay(); // Start on load
        updateCarousel(); // Set initial state
    }
});