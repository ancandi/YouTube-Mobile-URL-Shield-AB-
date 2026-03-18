// ==UserScript==
// @name YouTube Mobile URL Shield AB+
// @namespace http://tampermonkey.com/
// @version 3.9
// @description Fixed Fullscreen Tap + Split Logic Persistence
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // 1. REDIRECT ENGINE
    if (sessionStorage.getItem('yt-ad-reload-active') === 'true' && window.location.pathname.startsWith('/watch')) {
        window.location.replace(window.location.href);
    }

    // 2. SCORCHED EARTH DATA BLOCKADE
    const injectStyles = () => {
        if (document.getElementById('yt-hard-blocker')) return;
        const style = document.createElement('style');
        style.id = 'yt-hard-blocker';
        style.innerHTML = `
            img, svg, image, [style*="background-image"], .yt-core-image, 
            .ytm-thumb, .ytp-cued-thumbnail-overlay, .ytp-videowall-still-image { 
                display: none !important; visibility: hidden !important; 
            }
            #masthead-container, .ytm-header-bar, #related, #comments, .ytm-footer { 
                display: none !important; 
            }
            html, body { background: #000 !important; }
            video { opacity: 0 !important; }
        `;
        (document.head || document.documentElement).appendChild(style);
    };

    if (sessionStorage.getItem('yt-ad-reload-active') === 'true') {
        injectStyles();
        new MutationObserver(() => {
            document.querySelectorAll('img, image').forEach(i => i.remove());
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    // 3. THE SHIELD
    const shield = document.createElement('div');
    Object.assign(shield.style, {
        position: 'fixed', left: '0', width: '100vw', zIndex: '2147483647', 
        display: 'none', cursor: 'pointer', touchAction: 'manipulation',
        backgroundColor: 'transparent'
    });

    const bar = document.createElement('div');
    Object.assign(bar.style, {
        position: 'absolute', bottom: '0', width: '100%', height: '100px',
        backgroundColor: '#fff', color: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        fontWeight: 'bold', fontFamily: 'sans-serif', boxShadow: '0 -10px 20px rgba(0,0,0,0.3)'
    });
    bar.innerText = 'TAP TO UNMUTE';
    shield.appendChild(bar);

    let activeSrc = "";

    const handleUnmute = (e) => {
        if (e) { 
            e.preventDefault(); 
            e.stopImmediatePropagation(); 
        }
        
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            activeSrc = v.src;
            v.muted = false;
            v.volume = 1.0;
            // Force play and then re-force after a micro-delay to stop YT's auto-pause
            v.play().catch(() => v.play());
            setTimeout(() => { if (v.paused) v.play(); }, 30);
        });
        
        shield.style.display = 'none';
        return false;
    };

    shield.addEventListener('touchstart', handleUnmute, { capture: true, passive: false });
    shield.addEventListener('click', handleUnmute, { capture: true });

    // 4. MONETIZATION KILL
    let trig = false;
    const monKill = () => {
        if (!window.location.pathname.startsWith('/watch') || trig) return;
        const ad = document.querySelector('.ad-showing, .ad-interrupting');
        const v = document.querySelector('video');
        if (ad && v && !isNaN(v.duration) && v.duration > 0) {
            trig = true;
            sessionStorage.setItem('yt-ad-reload-active', 'true');
            window.location.replace(window.location.href);
        }
    };

    // 5. MAINTENANCE (5ms Polling)
    setInterval(() => {
        const isWatch = window.location.pathname.startsWith('/watch');
        const videos = document.querySelectorAll('video');
        let mutedFound = false;

        // Restore Original Split Logic
        if (isWatch) {
            // Watch: Fullscreen tap area (to protect history), but bar is hidden
            shield.style.top = '0'; 
            shield.style.height = '100vh';
            bar.style.display = 'none'; 
            monKill();
        } else {
            // Homepage: Bottom bar only, rest of screen is clickable
            shield.style.top = 'auto'; 
            shield.style.bottom = '0'; 
            shield.style.height = '100px';
            bar.style.display = 'flex';
            sessionStorage.removeItem('yt-ad-reload-active');
        }

        videos.forEach(v => {
            if (v.muted && v.src !== activeSrc && !document.querySelector('.ad-showing')) {
                mutedFound = true;
            }
            // Reset state if we scroll to a new video
            if (v.src !== activeSrc && activeSrc !== "") {
                activeSrc = "";
            }
        });

        if (trig || videos.length === 0) { shield.style.display = 'none'; return; }

        if (!document.querySelector('.ad-showing') && sessionStorage.getItem('yt-ad-reload-active') === 'true') {
            sessionStorage.removeItem('yt-ad-reload-active');
            const s = document.getElementById('yt-hard-blocker');
            if (s) s.remove();
        }

        if (mutedFound) {
            if (!shield.parentElement) document.body.appendChild(shield);
            shield.style.display = 'block'; // Use block so bar child shows up correctly
        } else {
            shield.style.display = 'none';
        }
    }, 5);

    window.addEventListener('popstate', () => { trig = false; activeSrc = ""; });
})();
