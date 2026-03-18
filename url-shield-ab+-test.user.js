// ==UserScript==
// @name YouTube Mobile URL Shield AB+ UNLEASHED
// @namespace http://tampermonkey.com/
// @version 4.9.0
// @description v4.8.9 - Adaptive Logic Removed. Always Visible Hitbox + Force Unmute.
// @author ancandi
// @run-at document-start
// @match https://*.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    let userWantsUnmute = false; 
    let activeSrc = ""; 
    let forceResumeTimer = null;
    let playStartTime = 0;
    let isNavigating = false;
    let amnestyGranted = false; 

    // --- 1. HISTORY STABILIZER ---
    window.addEventListener('popstate', () => {
        isNavigating = true;
        setTimeout(() => { isNavigating = false; }, 1200);
    });

    // --- 2. NUCLEAR RELOAD ENGINE ---
    const nuclearReload = () => {
        if (isNavigating) return;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('reload_ts', Date.now());
        try { sessionStorage.setItem('yt-ad-reload-active', 'true'); } catch(e) {}
        window.location.replace(currentUrl.toString());
        setTimeout(() => { window.location.href = currentUrl.toString(); }, 50);
    };

    // --- 3. DATA PREDATOR ---
    const predator = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
            const nodes = mutations[i].addedNodes;
            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                if (node.nodeType !== 1) continue;

                const isExplicitAd = node.classList?.contains('ad-showing') || 
                                     node.closest?.('.ad-showing') || 
                                     node.querySelector?.('.ytd-ad-slot-renderer') ||
                                     node.closest?.('ytm-promoted-video-renderer');

                if (isExplicitAd && !isNavigating) { nuclearReload(); return; }

                if (sessionStorage.getItem('yt-ad-reload-active') === 'true') {
                    // Always allow search images so results aren't broken
                    if (window.location.pathname.startsWith('/results') && ['IMG', 'IMAGE'].includes(node.tagName) && !isExplicitAd) continue;
                    
                    // Video Amnesty to prevent black screen on reload
                    if (node.tagName === 'VIDEO' && !isExplicitAd && !amnestyGranted) {
                        amnestyGranted = true; 
                        continue; 
                    }
                    if (['IMG', 'IMAGE'].includes(node.tagName) || (node.tagName === 'VIDEO' && isExplicitAd)) {
                        node.src = ''; node.remove(); 
                    }
                }
            }
        }
    });
    predator.observe(document.documentElement, { childList: true, subtree: true });

    // --- 4. THE PERMANENT HITBOX ---
    const shield = document.createElement('div');
    shield.id = 'reloader-unmute-shield';
    Object.assign(shield.style, {
        position: 'fixed', left: '0', width: '100vw', 
        zIndex: '2147483647', // Hard-coded top layer
        display: 'none', cursor: 'pointer', touchAction: 'manipulation', 
        backgroundColor: 'transparent', pointerEvents: 'auto'
    });

    const visualBar = document.createElement('div');
    Object.assign(visualBar.style, {
        position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100px',
        backgroundColor: '#0f0f0f', color: '#ffffff', textAlign: 'center',
        lineHeight: '100px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'sans-serif', 
        borderTop: '1px solid #333', boxShadow: '0 -10px 20px rgba(0,0,0,0.5)',
        zIndex: '2001', pointerEvents: 'none'
    });
    visualBar.innerText = 'TAP TO UNMUTE';
    shield.appendChild(visualBar);

    // --- 5. THE RESUME HAMMER ---
    const startForceResume = (videos) => {
        if (forceResumeTimer) clearInterval(forceResumeTimer);
        let attempts = 0;
        forceResumeTimer = setInterval(() => {
            videos.forEach(v => {
                if (v.paused && v.readyState >= 1) v.play().catch(() => {});
            });
            if (++attempts > 50) clearInterval(forceResumeTimer);
        }, 10); 
    };

    const handleInteraction = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
        userWantsUnmute = true; 
        return false;
    };
    ['touchstart', 'click'].forEach(evt => shield.addEventListener(evt, handleInteraction, { capture: true, passive: false }));

    // --- 6. MAINTENANCE LOOP (Aggressive Mode) ---
    setInterval(() => {
        const path = window.location.pathname;
        const isWatch = path.startsWith('/watch') || path.startsWith('/shorts');
        const videos = document.querySelectorAll('video');
        const adShowing = !!document.querySelector('.ad-showing') || !!document.querySelector('ytm-promoted-video-renderer');

        if (adShowing && !isNavigating) { nuclearReload(); return; }

        // LOGIC: Show if ANY muted video exists on screen, regardless of context
        let hasMutedVideo = false;
        videos.forEach(v => { if (v.muted && v.src) hasMutedVideo = true; });

        if (hasMutedVideo || userWantsUnmute) {
            if (!shield.parentElement) document.body.appendChild(shield);
            shield.style.display = 'block';
            
            if (isWatch) {
                shield.style.top = '0'; shield.style.height = '100vh';
            } else {
                shield.style.top = 'auto'; shield.style.bottom = '0'; shield.style.height = '100px';
            }
        } else {
            shield.style.display = 'none';
        }

        // Unmute + Hammer
        if (userWantsUnmute) {
            let success = false;
            videos.forEach(v => {
                if (v.src && v.readyState >= 1) {
                    v.muted = false; v.volume = 1.0;
                    if (!v.muted) { success = true; activeSrc = v.src; }
                }
            });
            if (success) {
                userWantsUnmute = false; 
                shield.style.display = 'none';
                startForceResume(videos);
                playStartTime = Date.now();
            }
        }

        // Cleanup
        if ((videos[0] && !videos[0].paused && !videos[0].muted && !adShowing && playStartTime > 0)) {
            if (Date.now() - playStartTime > 2000) {
                sessionStorage.removeItem('yt-ad-reload-active');
                amnestyGranted = false; 
                playStartTime = 0;
            }
        }
    }, 10);
})();
