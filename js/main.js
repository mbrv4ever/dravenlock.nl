/* ==========================================================
   Dravenlock Software - Hoofd-JS
   - Taal-switcher (NL/EN, met localStorage onthouden)
   - Mobile menu burger
   - Scroll-triggered animations (Intersection Observer)
   - Modals voor Disclaimer + Overeenkomst
   - AJAX contactformulier
   - Auto-set jaar in footer
   ========================================================== */

(function () {
    'use strict';

    // ----- Helper: alle elementen ophalen -----
    const $  = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    /* ============ TAAL ============ */
    const STORAGE_KEY = 'dravenlock-lang';
    const DEFAULT_LANG = 'nl';

    function detectLang() {
        // 1. Eerder gekozen taal
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'nl' || saved === 'en') return saved;
        } catch (e) { /* localStorage geblokkeerd */ }

        // 2. Browser-taal
        const navLang = (navigator.language || 'nl').toLowerCase();
        if (navLang.startsWith('nl')) return 'nl';
        return 'en';
    }

    function applyLang(lang) {
        // Update <html lang="..."> voor screenreaders
        document.documentElement.lang = lang;

        // Vervang alle teksten op basis van data-nl / data-en
        $$('[data-nl][data-en]').forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text !== null) {
                // Voor input/textarea placeholders
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Meta tags
        const metaDesc = $('meta[name="description"]');
        if (metaDesc) {
            const txt = metaDesc.getAttribute('data-' + lang);
            if (txt) metaDesc.setAttribute('content', txt);
        }

        // Update taal-knoppen
        $$('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });

        // Bewaar keuze
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* niet kritiek */ }
    }

    function initLang() {
        applyLang(detectLang());
        $$('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => applyLang(btn.dataset.lang));
        });
    }

    /* ============ MOBIELE NAVIGATIE ============ */
    function initMobileMenu() {
        const burger = $('#navBurger');
        const links  = $('#navLinks');
        if (!burger || !links) return;

        function toggle(open) {
            burger.classList.toggle('open', open);
            links.classList.toggle('open', open);
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        burger.addEventListener('click', () => {
            toggle(!burger.classList.contains('open'));
        });

        // Sluit menu bij klik op link
        $$('#navLinks a').forEach(a => {
            a.addEventListener('click', () => toggle(false));
        });

        // Sluit bij Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') toggle(false);
        });
    }

    /* ============ SCROLL REVEAL ============ */
    function initReveal() {
        const els = $$('.reveal');
        if (!els.length) return;

        // Fallback: als IntersectionObserver niet bestaat, toon alles meteen
        if (!('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('visible'));
            return;
        }

        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        els.forEach(el => io.observe(el));
    }

    /* ============ MODALS ============ */
    function initModals() {
        // Open via data-modal="naam"
        $$('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const name = trigger.dataset.modal;
                const modal = $('#modal-' + name);
                if (modal) openModal(modal);
            });
        });

        // Sluit knoppen
        $$('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const overlay = btn.closest('.modal-overlay');
                if (overlay) closeModal(overlay);
            });
        });

        // Klik buiten modal = sluiten
        $$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay);
            });
        });

        // Esc om te sluiten
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                $$('.modal-overlay.open').forEach(overlay => closeModal(overlay));
            }
        });
    }

    function openModal(overlay) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        // Focus de close-button voor a11y
        const closeBtn = overlay.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.focus();
    }

    function closeModal(overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ============ CONTACT FORM (mailto) ============ */
    function initContactForm() {
        const form = $('#contactForm');
        if (!form) return;

        const status = $('#cfStatus');
        const submit = $('#cfSubmit');
        const lang   = () => document.documentElement.lang || 'nl';

        const messages = {
            mailto: {
                nl: 'Je mailprogramma wordt geopend. Klik daar op Verzenden.',
                en: 'Your email app is opening. Press Send there.'
            },
            sending: {
                nl: 'Bericht wordt verstuurd...',
                en: 'Sending message...'
            },
            success: {
                nl: 'Bedankt! Je bericht is verstuurd.',
                en: 'Thank you! Your message has been sent.'
            },
            errorServer: {
                nl: 'Er ging iets mis. Probeer het later opnieuw.',
                en: 'Something went wrong. Please try again later.'
            },
            errorNetwork: {
                nl: 'Geen verbinding. Controleer je internet.',
                en: 'No connection. Please check your internet.'
            },
            // Veld-specifieke validatie meldingen
            fieldErrors: {
                name_empty: {
                    nl: 'Vul je naam in.',
                    en: 'Please enter your name.'
                },
                name_short: {
                    nl: 'Naam is te kort (minstens 2 tekens).',
                    en: 'Name is too short (at least 2 characters).'
                },
                email_empty: {
                    nl: 'Vul je e-mailadres in.',
                    en: 'Please enter your email address.'
                },
                email_invalid: {
                    nl: 'Voer een geldig e-mailadres in (bv. naam@voorbeeld.nl).',
                    en: 'Please enter a valid email address (e.g. name@example.com).'
                },
                message_empty: {
                    nl: 'Schrijf een bericht.',
                    en: 'Please write a message.'
                },
                message_short: {
                    nl: 'Bericht is te kort (minstens 10 tekens).',
                    en: 'Message is too short (at least 10 characters).'
                }
            }
        };

        function setStatus(msg, type) {
            status.textContent = msg;
            status.className = 'form-status' + (type ? ' ' + type : '');
        }

        function clearStatus() {
            status.textContent = '';
            status.className = 'form-status';
        }

        function clearFieldErrors() {
            $$('.field-invalid', form).forEach(f => {
                f.classList.remove('field-invalid');
            });
        }

        function markInvalid(field) {
            if (field) field.classList.add('field-invalid');
        }

        // Bij typen: rode rand weghalen zodra gebruiker corrigeert
        $$('#contactForm input, #contactForm textarea').forEach(f => {
            f.addEventListener('input', () => {
                f.classList.remove('field-invalid');
            });
        });

        /**
         * Valideer alle velden, return de eerste fout-melding key
         * + het veld dat fout is. Null als alles ok is.
         */
        function validateForm() {
            const name = form.querySelector('[name="name"]');
            const email = form.querySelector('[name="email"]');
            const message = form.querySelector('[name="message"]');

            const nameVal = name.value.trim();
            const emailVal = email.value.trim();
            const messageVal = message.value.trim();

            if (nameVal === '') {
                return { key: 'name_empty', field: name };
            }
            if (nameVal.length < 2) {
                return { key: 'name_short', field: name };
            }

            if (emailVal === '') {
                return { key: 'email_empty', field: email };
            }
            // Browser's eigen email-validatie via validity API
            if (!email.validity.valid) {
                return { key: 'email_invalid', field: email };
            }

            if (messageVal === '') {
                return { key: 'message_empty', field: message };
            }
            if (messageVal.length < 10) {
                return { key: 'message_short', field: message };
            }

            return null;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearStatus();
            clearFieldErrors();

            // Validatie met veld-specifieke melding
            const validation = validateForm();
            if (validation) {
                const msg = messages.fieldErrors[validation.key][lang()];
                setStatus(msg, 'error');
                markInvalid(validation.field);
                validation.field.focus();
                return;
            }

            // Geen server meer (GitHub Pages): open het mailprogramma
            // van de bezoeker met alles al ingevuld.
            const naam    = form.querySelector('[name="name"]').value.trim();
            const email   = form.querySelector('[name="email"]').value.trim();
            const bericht = form.querySelector('[name="message"]').value.trim();
            const onderwerp = (lang() === 'en' ? 'Message from ' : 'Bericht van ') + naam;
            const tekst = bericht + '\n\n--\n' + naam + '\n' + email;
            window.location.href = 'mailto:service@dravenlock.nl'
                + '?subject=' + encodeURIComponent(onderwerp)
                + '&body=' + encodeURIComponent(tekst);
            setStatus(messages.mailto[lang()], 'success');
        });
    }

    /* ============ JAAR IN FOOTER ============ */
    function initFooterYear() {
        const y = $('#yearMark');
        if (y) y.textContent = new Date().getFullYear();
    }

    /* ============ SERVICE WORKER (PWA) ============ */
    function initServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        // Dynamische pad-detectie: werkt zowel in de site-root
        // (dravenlock.nl/) als in een sub-map zoals dravenlock.nl/test/.
        // We leiden de scope af van de huidige pagina, en het sw.js
        // pad ligt in dezelfde directory als index.html.
        //
        // location.pathname voorbeelden:
        //   "/"             -> swPath="sw.js",      scope="/"
        //   "/index.html"   -> swPath="sw.js",      scope="/"
        //   "/test/"        -> swPath="test/sw.js", scope="/test/"
        //   "/test/index.html" -> swPath="test/sw.js", scope="/test/"
        const path = window.location.pathname;
        // Pak de directory deel - alles tot en met de laatste /
        const lastSlash = path.lastIndexOf('/');
        const scope = path.substring(0, lastSlash + 1) || '/';
        const swPath = scope + 'sw.js';

        // Registreer na page-load zodat het de initial render niet vertraagt
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(swPath, { scope: scope })
                .then((registration) => {
                    // Bij update: vraag de nieuwe SW om actief te worden
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' &&
                                    navigator.serviceWorker.controller) {
                                    console.log('[Dravenlock] Nieuwe versie ' +
                                                'beschikbaar - refresh om te activeren.');
                                }
                            });
                        }
                    });
                })
                .catch((err) => {
                    console.warn('[Dravenlock] SW registratie faalde:', err);
                });
        });
    }

    /* ============ INIT ============ */
    function init() {
        initLang();
        initMobileMenu();
        initReveal();
        initModals();
        initContactForm();
        initFooterYear();
        initServiceWorker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
