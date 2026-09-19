document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const demoLogin = document.getElementById('demoLogin');
  const togglePassword = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');
  const messageBox = document.getElementById('loginMessage');

  const setMessage = (text, type = 'success') => {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message-box ${type}`;
  };

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  if (demoLogin) {
    demoLogin.addEventListener('click', () => {
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      if (email) email.value = 'demo@cauverymed.local';
      if (password) password.value = 'demo123';
      setMessage('Demo login activated.', 'success');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.error || 'Login failed.', 'error');
          return;
        }

        localStorage.setItem('cauveryUser', JSON.stringify(data.user));
        setMessage('Login successful. Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard.html';
        }, 350);
      } catch (error) {
        setMessage('Login error. Please try again.', 'error');
      }
    });
  }

  const savedUser = localStorage.getItem('cauveryUser');
  if (savedUser && window.location.pathname.endsWith('login.html')) {
    window.location.href = '/dashboard.html';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('cauveryUser');
      window.location.href = '/login.html';
    });
  }
});
