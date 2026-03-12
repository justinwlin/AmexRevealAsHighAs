// ==UserScript==
// @name         Amex Reveal Real Rate
// @namespace    https://github.com/justinwlin/AmexRevealAsHighAs
// @version      1.2
// @description  Strips "elevatedOffer" variant from Amex Rates & Fees links to reveal the real offer terms instead of the inflated "As High As" marketing language.
// @author       justinwlin
// @match        *://www.americanexpress.com/*credit-cards*
// @match        *://www.americanexpress.com/us/credit-cards/*
// @match        *://www.americanexpress.com/en-us/credit-cards/*
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/justinwlin/AmexRevealAsHighAs/main/amex-reveal-real-rate.user.js
// @downloadURL  https://raw.githubusercontent.com/justinwlin/AmexRevealAsHighAs/main/amex-reveal-real-rate.user.js
// ==/UserScript==

(function () {
  'use strict';

  console.log('[Amex Reveal] Script loaded on:', window.location.href);

  // ── Styles ──────────────────────────────────────────────────────────
  GM_addStyle(`
    /* ── Floating Button ─────────────────────────────────────────── */
    #amex-reveal-btn {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 14px 22px !important;
      background: linear-gradient(135deg, #c8102e 0%, #9b0020 100%) !important;
      color: #fff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      border: none !important;
      border-radius: 50px !important;
      cursor: pointer !important;
      box-shadow: 0 4px 16px rgba(200, 16, 46, 0.5) !important;
      transition: all 0.2s ease !important;
      text-decoration: none !important;
      line-height: 1.2 !important;
      letter-spacing: 0.3px !important;
    }
    #amex-reveal-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 24px rgba(200, 16, 46, 0.65) !important;
      background: linear-gradient(135deg, #e0132f 0%, #b50025 100%) !important;
    }
    #amex-reveal-btn:active {
      transform: translateY(0) !important;
    }
    #amex-reveal-btn .icon {
      font-size: 18px !important;
    }

    /* ── Toast notification ──────────────────────────────────────── */
    #amex-reveal-toast {
      position: fixed !important;
      bottom: 80px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      background: #1a1a1a !important;
      color: #fff !important;
      padding: 12px 20px !important;
      border-radius: 10px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
      opacity: 0 !important;
      transform: translateY(10px) !important;
      transition: all 0.3s ease !important;
      pointer-events: none !important;
      max-width: 340px !important;
    }
    #amex-reveal-toast.show {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    /* ── Badge on rewritten links ────────────────────────────────── */
    .amex-reveal-cleaned {
      position: relative !important;
    }
    .amex-reveal-badge {
      display: inline-block !important;
      background: #27ae60 !important;
      color: #fff !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      padding: 2px 5px !important;
      border-radius: 3px !important;
      margin-left: 4px !important;
      vertical-align: middle !important;
      letter-spacing: 0.4px !important;
      text-transform: uppercase !important;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
    }
  `);

  // ── Helpers ─────────────────────────────────────────────────────────

  function cleanUrl(href) {
    try {
      const url = new URL(href);
      url.searchParams.delete('oneXpVariant');
      return url.toString();
    } catch {
      return href.replace(/[?&]oneXpVariant=[^&]*/gi, '');
    }
  }

  function showToast(message, duration = 3000) {
    let toast = document.getElementById('amex-reveal-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'amex-reveal-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
  }

  // ── Find and rewrite elevated links ────────────────────────────────

  function findAndRewriteLinks() {
    const links = document.querySelectorAll('a[href*="oneXpVariant"]');
    let count = 0;

    links.forEach((a) => {
      if (a.classList.contains('amex-reveal-cleaned')) return;

      const original = a.href;
      const cleaned = cleanUrl(original);
      a.setAttribute('href', cleaned);
      a.classList.add('amex-reveal-cleaned');

      // Add a small badge next to the link text
      if (!a.querySelector('.amex-reveal-badge')) {
        const badge = document.createElement('span');
        badge.className = 'amex-reveal-badge';
        badge.textContent = '✓ REAL';
        a.appendChild(badge);
      }

      count++;
      console.log('[Amex Reveal] Cleaned link:', original, '→', cleaned);
    });

    return count;
  }

  // ── Get the clean rates URL ────────────────────────────────────────

  function getRealRatesUrl() {
    // Look for Rates & Fees links (already cleaned or original)
    const selectors = [
      'a[href*="/prospect/terms/"]',
      'a[href*="key=tncBody"]',
      'a[aria-label*="Rates"]',
      'a[aria-label*="rates"]',
    ];

    for (const sel of selectors) {
      const link = document.querySelector(sel);
      if (link) {
        return cleanUrl(link.href);
      }
    }
    return null;
  }

  // ── Floating Button ────────────────────────────────────────────────

  function addButton() {
    if (document.getElementById('amex-reveal-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'amex-reveal-btn';
    btn.innerHTML = '<span class="icon">🔍</span> View Real Rates & Fees';
    btn.title = 'Open the real Rates & Fees without the inflated "As High As" elevated offer terms';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = getRealRatesUrl();
      if (url) {
        showToast('Opening real rates (without elevated offer)…');
        window.open(url, '_blank');
      } else {
        showToast('⚠️ No Rates & Fees link found on this page. Try scrolling down first.', 4000);
      }
    });

    document.body.appendChild(btn);
    console.log('[Amex Reveal] Button injected');
  }

  // ── Init ────────────────────────────────────────────────────────────

  function init() {
    const count = findAndRewriteLinks();
    addButton();

    if (count > 0) {
      showToast(`✅ Fixed ${count} link${count > 1 ? 's' : ''} — now showing real rates`, 4000);
    }

    console.log(`[Amex Reveal] Init complete. Cleaned ${count} link(s). Button added.`);
  }

  // Run now
  init();

  // Also watch for dynamically added links (Amex pages are heavy SPAs)
  const observer = new MutationObserver(() => {
    const uncleaned = document.querySelectorAll('a[href*="oneXpVariant"]:not(.amex-reveal-cleaned)');
    if (uncleaned.length > 0) {
      const count = findAndRewriteLinks();
      if (count > 0) {
        showToast(`✅ Fixed ${count} more link${count > 1 ? 's' : ''}`, 2500);
      }
    }
    // Re-add button if Amex's SPA nuked it
    if (!document.getElementById('amex-reveal-btn')) {
      addButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Extra safety: re-run after a delay in case content loads late
  setTimeout(init, 2000);
  setTimeout(init, 5000);
})();
