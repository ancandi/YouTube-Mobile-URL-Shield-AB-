// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @version 3.0.4
// @match https://*.youtube.com/*
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';
    let u = false, l = false;
    const d = document, w = window, sh = d.createElement('div'), br = d.createElement('div'), hi = d.createElement('div'), tb = d.createElement('div');

    const update = () => {
        const dark = d.documentElement.hasAttribute('dark') || d.body.classList.contains('ytm-dark-mode') || w.matchMedia('(prefers-color-scheme: dark)').matches;
        br.style.background = dark ? 'rgba(15,15,15,0.9)' : 'rgba(255,255,255,0.9)';
        br.style.color = dark ? '#fff' : '#0f0f0f';
        br.style.borderTop = `1px solid ${dark ? '#333' : '#e5e5e5'}`;
        hi.style.background = dark ? '#fff' : '#0f0f0f';
        hi.style.color = dark ? '#000' : '#fff';
        tb.style.background = dark ? 'rgba(28,28,28,0.75)' : 'rgba(240,240,240,0.75)';
        tb.style.border = `1px solid rgba(${dark ? '255,255,255' : '0,0,0'},0.1)`;
    };

    new MutationObserver(() => {
        if (d.querySelector('.ad-showing')) location.replace(location.href + (location.href.includes('?') ? '&' : '?') + 'r=' + Date.now());
    }).observe(d.documentElement, { childList: true, subtree: true });

    br.innerText = 'TAP TO UNMUTE'; hi.innerText = 'HIDE';
    Object.assign(sh.style, { position: 'fixed', inset: '0', zIndex: '2147483647', display: 'none', pointerEvents: 'none' });
    Object.assign(br.style, { position: 'absolute', bottom: '0', width: '100%', height: '100px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', backdropFilter: 'blur(8px)', webkitBackdropFilter: 'blur(8px)' });
    Object.assign(hi.style, { position: 'fixed', bottom: '100px', left: '15px', width: '60px', height: '40px', textAlign: 'center', lineHeight: '40px', borderRadius: '10px 10px 0 0', zIndex: '2147483647', display: 'none', pointerEvents: 'auto' });
    Object.assign(tb.style, { position: 'fixed', bottom: '40px', right: '20px', width: '70px', height: '45px', borderRadius: '12px', zIndex: '0', display: 'none', pointerEvents: 'auto', backdropFilter: 'blur(8px)', webkitBackdropFilter: 'blur(8px)' });

    sh.appendChild(br);
    hi.ontouchstart = e => { e.preventDefault(); l = true; };
    tb.ontouchstart = e => { e.preventDefault(); l = false; };
    sh.ontouchstart = () => { if(!l) u = true; };

    setInterval(() => {
        const path = location.pathname.startsWith('/results'), act = d.activeElement;
        if (!path && l) l = false;
        if ((act && /INPUT|TEXTAREA/.test(act.tagName)) || d.querySelector('ytm-browse-sidebar-renderer[opened], .ytm-sidebar-open')) {
            sh.style.display = hi.style.display = tb.style.display = 'none'; return;
        }
        update();
        if (l && path) {
            sh.style.display = hi.style.display = 'none'; if (!tb.parentNode) d.body.appendChild(tb); tb.style.display = 'block';
        } else {
            tb.style.display = 'none';
            let v = d.getElementsByTagName('video'), n = false;
            for (let i=0; i<v.length; i++) if (v[i].src && !v[i].paused && v[i].muted) { n = true; break; }
            if (n || u) {
                if (!sh.parentNode) d.body.appendChild(sh); sh.style.display = 'block';
                if (path && !l) { if (!hi.parentNode) d.body.appendChild(hi); hi.style.display = 'block'; } else hi.style.display = 'none';
            } else sh.style.display = hi.style.display = 'none';
        }
        if (u && !l) {
            let v = d.getElementsByTagName('video');
            for (let i=0; i<v.length; i++) if (v[i].readyState >= 1) { v[i].muted = false; v[i].volume = 1; if (v[i].paused) v[i].play(); }
            u = false;
        }
    }, 40);
})();
