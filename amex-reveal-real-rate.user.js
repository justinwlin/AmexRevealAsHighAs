// ==UserScript==
// @name         Amex Reveal Real Rate
// @namespace    https://github.com/amex-reveal
// @version      1.0
// @description  Strips "elevatedOffer" variant from Amex Rates & Fees links to reveal the real offer terms instead of the inflated "As High As" marketing language.
// @author       You
// @match        https://www.americanexpress.com/us/credit-cards/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ── Styles ──────────────────────────────────────────────────────────
  GM_addStyle(`
    #amex-reveal-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #006fcf 0%, #0050a0 100%);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 80, 160, 0.4);
      transition: all 0.2s ease;
    }
    #amex-reveal-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 80, 160, 0.55);
      background: linear-gradient(135deg, #0080e6 0%, #005cbf 100%);
    }
    #amex-reveal-btn:active {
      transform: translateY(0);
    }
    #amex-reveal-btn .icon {
      font-size: 18px;
    }

    /* ── Modal ─────────────────────────────────────────────────────── */
    #amex-reveal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999999;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    #amex-reveal-overlay.visible {
      opacity: 1;
    }
    #amex-reveal-modal {
      background: #fff;
      border-radius: 16px;
      width: 90vw;
      max-width: 960px;
      height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      overflow: hidden;
      transform: translateY(30px);
      transition: transform 0.25s ease;
    }
    #amex-reveal-overlay.visible #amex-reveal-modal {
      transform: translateY(0);
    }
    #amex-reveal-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e5e5;
      background: #f7f8fa;
    }
    #amex-reveal-modal-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    }
    #amex-reveal-modal-header .subtitle {
      font-size: 12px;
      color: #888;
      font-weight: 400;
    }
    #amex-reveal-close-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    #amex-reveal-close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }
    #amex-reveal-iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
    #amex-reveal-loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      color: #888;
      font-size: 14px;
    }
    .amex-reveal-badge {
      display: inline-block;
      background: #e74c3c;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
      vertical-align: middle;
      letter-spacing: 0.5px;
    }

    /* ── Link rewrite indicator ─────────────────────────────────── */
    .amex-reveal-cleaned::after {
      content: " ✓ real rates";
      font-size: 10px;
      color: #27ae60;
      font-weight: 600;
      margin-left: 4px;
    }
  `);

  // ── Helpers ─────────────────────────────────────────────────────────
  /**
   * Given a Rates & Fees URL, strip the oneXpVariant param so the
   * real (non-elevated) offer terms load.
   */
  function cleanUrl(href) {
    try {
      const url = new URL(href);
      url.searchParams.delete('oneXpVariant');
      // Also clean up any trailing empty params
      let cleaned = url.toString();
      // Remove any && artifacts
      cleaned = cleaned.replace(/&&+/g, '&').replace(/\?&/, '?').replace(/&$/, '');
      return cleaned;
    } catch {
      // Fallback: regex strip
      return href
        .replace(/[?&]oneXpVariant=[^&]*/gi, '')
        .replace(/\?&/, '?')
        .replace(/&&+/g, '&')
        .replace(/&$/, '');
    }
  }

  /**
   * Find all Rates & Fees links on the page that have the
   * oneXpVariant parameter.
   */
  function findElevatedLinks() {
    const allLinks = document.querySelectorAll('a[href*="oneXpVariant"]');
    return Array.from(allLinks);
  }

  // ── Rewrite links in-page ──────────────────────────────────────────
  function rewriteLinks() {
    const links = findElevatedLinks();
    links.forEach((a) => {
      const cleaned = cleanUrl(a.href);
      a.setAttribute('href', cleaned);
      a.classList.add('amex-reveal-cleaned');
    });
    return links.length;
  }

  // ── Build the real-rates URL from the page context ─────────────────
  function getRealRatesUrl() {
    // First look for existing Rates & Fees links (already cleaned or not)
    const ratesLink = document.querySelector(
      'a[href*="/prospect/terms/"], a[href*="/card-application/apply/prospect/terms/"]'
    );
    if (ratesLink) {
      return cleanUrl(ratesLink.href);
    }
    return null;
  }

  // ── Modal ──────────────────────────────────────────────────────────
  function openModal(url) {
    // Remove existing modal if any
    const existing = document.getElementById('amex-reveal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'amex-reveal-overlay';

    overlay.innerHTML = `
      <div id="amex-reveal-modal">
        <div id="amex-reveal-modal-header">
          <div>
            <h2>🔍 Real Rates &amp; Fees <span class="amex-reveal-badge">NO ELEVATED OFFER</span></h2>
            <span class="subtitle">${url}</span>
          </div>
          <button id="amex-reveal-close-btn" title="Close">✕</button>
        </div>
        <div id="amex-reveal-loading">Loading real rates…</div>
        <iframe id="amex-reveal-iframe" style="display:none;"></iframe>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // Close handlers
    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 250);
    };
    document.getElementById('amex-reveal-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Load iframe
    const iframe = document.getElementById('amex-reveal-iframe');
    const loading = document.getElementById('amex-reveal-loading');

    iframe.addEventListener('load', () => {
      loading.style.display = 'none';
      iframe.style.display = 'block';
    });

    // If iframe fails (CORS/X-Frame-Options), fall back to opening in new tab
    iframe.addEventListener('error', () => {
      window.open(url, '_blank');
      close();
    });

    iframe.src = url;

    // Safety timeout — if iframe doesn't load in 4s, open in new tab
    setTimeout(() => {
      if (loading.style.display !== 'none') {
        // The terms page may block iframes — open directly
        window.open(url, '_blank');
        close();
      }
    }, 4000);
  }

  // ── Floating Button ────────────────────────────────────────────────
  function addButton() {
    if (document.getElementById('amex-reveal-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'amex-reveal-btn';
    btn.innerHTML = '<span class="icon">🔍</span> View Real Rates';
    btn.title = 'Open Rates & Fees without the elevated offer variant';

    btn.addEventListener('click', () => {
      const url = getRealRatesUrl();
      if (url) {
        openModal(url);
      } else {
        // No link found — try to open in new tab with a generic message
        alert(
          'Could not find a Rates & Fees link on this page.\n' +
          'Try scrolling down to the Rates & Fees section first.'
        );
      }
    });

    document.body.appendChild(btn);
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    const count = rewriteLinks();
    addButton();
    console.log(
      `[Amex Reveal] Cleaned ${count} elevated-offer link(s). Button injected.`
    );
  }

  // Run now, and also observe for dynamically added links (SPA behavior)
  init();

  const observer = new MutationObserver(() => {
    const links = findElevatedLinks();
    if (links.length > 0) {
      rewriteLinks();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
