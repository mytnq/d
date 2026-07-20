(function () {
  const API_BASE = 'https://totallynotquizlet.duckdns.org';
  const STUDY_ROOT = 'https://totallynotquizlet.github.io/study/';
  const BROKEN_LINK_URL = 'https://mytnq.github.io/d/404link';
  const ERROR_URL = 'https://mytnq.github.io/d/';

  const titleEl = document.getElementById('status-title');
  const messageEl = document.getElementById('status-message');
  const continueBtn = document.getElementById('continue-button');

  function setContinueDestination(url) {
    if (continueBtn) {
      continueBtn.onclick = () => {
        window.location.href = url;
      };
    }
  }

  function showState(title, message, destination) {
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    setContinueDestination(destination);
  }

  function redirectTo(url) {
    window.location.replace(url);
  }

  // Use the same URL-safe Base64 encoding as the shared deck storage code.
  function base64UrlEncode(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i += 1) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    const base64String = btoa(binaryString);
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function buildLongShareUrl(deck) {
    const json = JSON.stringify(deck);
    const encoded = base64UrlEncode(json);
    return `${STUDY_ROOT}#${encoded}`;
  }

  async function resolveShortLink(code) {
    try {
      const response = await fetch(`${API_BASE}/api/deck/${code}`);

      if (response.status === 404) {
        redirectTo(BROKEN_LINK_URL);
        return;
      }

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const deck = await response.json();
      const longUrl = buildLongShareUrl(deck);
      setContinueDestination(longUrl);
      redirectTo(longUrl);
    } catch (err) {
      console.error('TNQ: Failed to resolve short link', err);
      redirectTo(ERROR_URL);
    }
  }

  function init() {
    const path = window.location.pathname;

    // Bare "/d" or "/d/" (no code) -> generic error/try-again state
    if (/\/d\/?$/.test(path)) {
      showState(
        'Something went wrong',
        'An error occurred loading that link. Please try the link again.',
        STUDY_ROOT
      );
      return;
    }

    // "/d/404link" -> the link doesn't exist / has expired
    if (/\/d\/404link\/?$/.test(path)) {
      showState(
        "This link doesn't exist",
        'That shared deck link is invalid or has expired.',
        STUDY_ROOT
      );
      return;
    }

    // "/d/<4-char code>" -> actually resolve it against the server
    const match = path.match(/\/d\/([0-9A-Za-z]{4})\/?$/);
    if (match) {
      setContinueDestination(STUDY_ROOT); // sensible default while the fetch is in flight
      resolveShortLink(match[1]);
      return;
    }

    // Any other unmatched path (typo, unrelated 404) -> leave default copy,
    // just make sure the button goes somewhere sensible.
    setContinueDestination(STUDY_ROOT);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
