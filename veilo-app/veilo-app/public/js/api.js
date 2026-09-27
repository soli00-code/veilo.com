// Veilo — frontend API client. Loaded on every logged-in-app page (and login/register).
// Talks to the Express API mounted at /api/*; the JWT lives in an httpOnly cookie,
// so we never touch a token here — every call just needs credentials: 'include'.

const Veilo = (() => {
  const API_BASE = '/api';

  async function apiFetch(path, { method = 'GET', body, isFormData = false, headers = {} } = {}) {
    const opts = { method, credentials: 'include', headers: { ...headers } };

    if (body !== undefined) {
      if (isFormData) {
        opts.body = body; // browser sets the multipart boundary itself
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(API_BASE + path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* empty body, fine */
    }

    if (!res.ok) {
      const message = (data && data.error) || `Something went wrong (${res.status}).`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Call at the top of every protected page. Redirects to login (carrying a
  // ?next= back-link) if there's no valid session, otherwise resolves with
  // the current user and paints the shared nav chrome (name/avatar).
  async function requireSession() {
    try {
      const user = await apiFetch('/auth/session');
      paintIdentityChrome(user);
      return user;
    } catch (err) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?next=${next}`;
      return null;
    }
  }

  function paintIdentityChrome(user) {
    document.querySelectorAll('[data-me="nickname"]').forEach((el) => (el.textContent = user.nickname));
    document.querySelectorAll('[data-me="glyph"]').forEach((el) => (el.textContent = initialsOf(user.nickname)));
    document.querySelectorAll('[data-me="blob"]').forEach((el) => {
      el.className = el.className.replace(/\bblob-[1-6]\b/, auraClass(user.auraId));
    });
  }

  function auraClass(auraId) {
    const n = Number(auraId);
    return 'blob-' + (n >= 1 && n <= 6 ? n : 1);
  }

  function initialsOf(nickname) {
    return (nickname || '')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function timeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    const days = Math.floor(hrs / 24);
    return days + 'd';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function reasonLabel(type) {
    return (
      {
        photos_or_contact: 'Asking for photos or off-app contact',
        harassment: 'Harassment or hate speech',
        fake_account: 'Suspected fake account',
        other: 'Something else'
      }[type] || type
    );
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      /* ignore — we're leaving the page anyway */
    }
    window.location.href = '/login.html';
  }

  // Small inline error banner used across forms/modals. Creates the node once
  // per container and reuses it on subsequent calls.
  function showError(container, message) {
    let el = container.querySelector('.js-error-banner');
    if (!el) {
      el = document.createElement('div');
      el.className = 'js-error-banner';
      el.style.cssText =
        'background:#FDEDF2;color:#C4306B;border-radius:12px;padding:10px 14px;font-size:0.85rem;font-weight:600;margin-bottom:16px;';
      container.prepend(el);
    }
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
  }

  return {
    apiFetch,
    requireSession,
    paintIdentityChrome,
    auraClass,
    initialsOf,
    timeAgo,
    escapeHtml,
    reasonLabel,
    logout,
    showError
  };
})();
