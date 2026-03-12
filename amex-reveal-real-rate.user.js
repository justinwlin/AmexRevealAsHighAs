// ==UserScript==
// @name         Amex Reveal Real Rate
// @namespace    https://github.com/justinwlin/AmexRevealAsHighAs
// @version      2.0
// @description  Adds a button next to Amex Rates & Fees links to view the real offer (without the inflated "As High As" language).
// @author       justinwlin
// @match        *://www.americanexpress.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/justinwlin/AmexRevealAsHighAs/main/amex-reveal-real-rate.user.js
// @downloadURL  https://raw.githubusercontent.com/justinwlin/AmexRevealAsHighAs/main/amex-reveal-real-rate.user.js
// ==/UserScript==

(function () {
  'use strict';

  function cleanUrl(href) {
    try {
      var url = new URL(href);
      url.searchParams.delete('oneXpVariant');
      return url.toString();
    } catch (e) {
      return href.replace(/[?&]oneXpVariant=[^&]*/gi, '');
    }
  }

  function addButtons() {
    // Find all links that have the elevated offer param
    var links = document.querySelectorAll('a[href*="oneXpVariant"]');

    for (var i = 0; i < links.length; i++) {
      var link = links[i];

      // Skip if we already added a button next to this link
      if (link.dataset.amexRevealDone) continue;
      link.dataset.amexRevealDone = 'true';

      var realUrl = cleanUrl(link.href);

      // Create the button
      var btn = document.createElement('a');
      btn.href = realUrl;
      btn.target = '_blank';
      btn.rel = 'noreferrer';
      btn.textContent = '👁️ See Real Rate';
      btn.style.cssText = [
        'display:inline-block',
        'margin-left:10px',
        'padding:6px 14px',
        'background:#c8102e',
        'color:#fff',
        'font-size:13px',
        'font-weight:bold',
        'font-family:Arial,sans-serif',
        'border-radius:6px',
        'text-decoration:none',
        'cursor:pointer',
        'vertical-align:middle',
      ].join(';');

      // Insert right after the link
      link.parentNode.insertBefore(btn, link.nextSibling);

      console.log('[Amex Reveal] Added button next to:', link.textContent.trim());
    }
  }

  // Run immediately
  addButtons();

  // Watch for dynamically added content (Amex is a SPA)
  new MutationObserver(addButtons).observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Safety retries for slow-loading content
  setTimeout(addButtons, 2000);
  setTimeout(addButtons, 5000);
  setTimeout(addButtons, 10000);

  console.log('[Amex Reveal] Script loaded.');
})();
