
(async () => {
  // Load repo-specific config
  const cfg = await fetch('./config.json', {cache: 'no-store'}).then(r => r.json()).catch(() => ({}));

  // Set document title
  if (cfg.siteName) document.title = cfg.siteName;

  // Inject GA if provided
  if (cfg.gaId) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); } window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', cfg.gaId);
  }

  // Banner logic
  const bannerEl = document.querySelector('[data-id="banner"]')?.closest('section,div,header') || document.querySelector('[data-id="banner"]');
  const bannerSpan = document.querySelector('[data-id="banner"]');
  if (bannerSpan) {
    if (cfg.banner && cfg.banner.trim()) {
      bannerSpan.textContent = cfg.banner;
      if (bannerEl) bannerEl.hidden = false;
    } else {
      if (bannerEl) bannerEl.hidden = true;
    }
  }

  // Prices
  const p1 = document.querySelector('[data-id="price1"]');
  const p2 = document.querySelector('[data-id="price2"]');
  if (p1 && cfg.prices && cfg.prices.first) p1.textContent = cfg.prices.first;
  if (p2 && cfg.prices && cfg.prices.second) p2.textContent = cfg.prices.second;

  // Buttons
  const setHref = (sel, href) => { const el = document.querySelector(sel); if (el && href) el.setAttribute('href', href); };
  setHref('[data-id="btn-telegram"]', cfg.telegramLink);
  setHref('[data-id="btn-whatsapp"]', cfg.whatsappLink);

  // Optional: auto-UTM for external buttons if not present
  if (cfg.utmCampaign) {
    const params = new URLSearchParams(location.search);
    const hasUTM = ['utm_source','utm_medium','utm_campaign'].some(k => params.get(k));
    if (!hasUTM) {
      document.querySelectorAll('a[data-track-utm]').forEach(a => {
        try {
          const u = new URL(a.href, location.href);
          if (u.origin !== location.origin) {
            if (!u.searchParams.get('utm_campaign')) {
              u.searchParams.set('utm_source', 'site');
              u.searchParams.set('utm_medium', 'button');
              u.searchParams.set('utm_campaign', cfg.utmCampaign);
              a.href = u.toString();
            }
          }
        } catch(e){}
      });
    }
  }

  // Click tracking for all buttons/links
  function labelFor(el) {
    const href = (el.getAttribute('href') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const cls = (el.className || '').toLowerCase();
    const text = (el.textContent || '').trim().toLowerCase().slice(0,40);
    if (/t\.me|telegram/.test(href+id+cls+text)) return 'telegram';
    if (/wa\.me|whatsapp/.test(href+id+cls+text)) return 'whatsapp';
    if (el.dataset && el.dataset.label) return el.dataset.label.toLowerCase();
    if (href) {
      try { 
        const u = new URL(href, location.href);
        if (u.hostname && u.hostname !== location.hostname) return 'external_' + u.hostname;
      } catch(e) {}
    }
    return text || href || id || 'button';
  }
  function sendClick(label) {
    if (typeof gtag === 'function') {
      gtag('event', 'click', { event_category: 'button', event_label: label, transport_type: 'beacon' });
    }
  }
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a,button');
    if (!a) return;
    const label = labelFor(a);
    sendClick(label);
    if (a.tagName === 'A') {
      const target = a.getAttribute('target');
      const href = a.getAttribute('href') || '';
      if (!target || target === '_self') {
        if (!/^#/.test(href)) {
          e.preventDefault();
          setTimeout(() => window.location.assign(a.href), 120);
        }
      }
    }
  }, { passive: false });
})();
