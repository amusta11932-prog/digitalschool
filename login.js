// AI Learning Hub — Standalone Login / Register page
// For students aged 12-18

// ===== Supabase config =====
// Get these from: Supabase dashboard -> Project Settings -> API
// Replace the two values below with your own.
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const SUPABASE_CONFIGURED = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Where to send the user after a successful login / signup
const AFTER_AUTH = 'index.html';

let supabase = null;
if (SUPABASE_CONFIGURED && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ===== Tabs (login / register) =====
const tabs = document.querySelectorAll('.tab');
const forms = {
    login: document.getElementById('loginForm'),
    register: document.getElementById('registerForm')
};

function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    Object.values(forms).forEach(f => f.classList.toggle('active', f.id === name + 'Form'));
}

tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); switchTab(a.dataset.goto); });
});

// ===== Message helper =====
function showMsg(el, text, type) {
    el.textContent = text;
    el.className = 'msg ' + type;
}

// ===== Register =====
forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('registerMsg');

    if (!SUPABASE_CONFIGURED) {
        return showMsg(msg, 'Supabase not configured yet — add your URL and key in login.js.', 'error');
    }

    showMsg(msg, 'Creating account…', 'info');
    const fd = new FormData(forms.register);
    const { data, error } = await supabase.auth.signUp({
        email: fd.get('email'),
        password: fd.get('password'),
        options: {
            data: {
                full_name: fd.get('full_name') || '',
                grade_level: Number(fd.get('grade_level')) || null
            }
        }
    });

    if (error) return showMsg(msg, error.message, 'error');

    if (data.session === null) {
        showMsg(msg, 'Check your email to confirm your account, then log in.', 'success');
    } else {
        showMsg(msg, 'Account created! Redirecting…', 'success');
        setTimeout(() => { location.href = AFTER_AUTH; }, 1000);
    }
});

// ===== Login =====
forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('loginMsg');

    if (!SUPABASE_CONFIGURED) {
        return showMsg(msg, 'Supabase not configured yet — add your URL and key in login.js.', 'error');
    }

    showMsg(msg, 'Logging in…', 'info');
    const fd = new FormData(forms.login);
    const { error } = await supabase.auth.signInWithPassword({
        email: fd.get('email'),
        password: fd.get('password')
    });

    if (error) return showMsg(msg, error.message, 'error');

    showMsg(msg, 'Logged in! Redirecting…', 'success');
    setTimeout(() => { location.href = AFTER_AUTH; }, 800);
});

// ===== Already logged in? Go straight to the site =====
if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) location.href = AFTER_AUTH;
    });
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) location.href = AFTER_AUTH;
    });
}
