
(function () {
    'use strict';

    /* =========================================================
       WEEBLY PROTECTION — WPX
       Version externe — phase de test
       ========================================================= */

    /* ---------------------------------------------------------
       1. VERROUILLAGE / DOUBLE CHARGEMENT
       --------------------------------------------------------- */

    if (window.__WPX_CORE__) {
        return;
    }

    try {
        Object.defineProperty(window, '__WPX_CORE__', {
            value: {
                version: '1.0',
                started: Date.now()
            },
            writable: false,
            configurable: false,
            enumerable: false
        });
    } catch (e) {
        return;
    }


    /* ---------------------------------------------------------
       2. ÉTAT INTERNE
       --------------------------------------------------------- */

    var state = {
        attempts: 0,
        lastActivity: Date.now(),
        devToolsHits: 0,
        reacting: false
    };


    /* ---------------------------------------------------------
       3. DÉTECTION TACTILE
       --------------------------------------------------------- */

    var isTouchDevice =
        ('ontouchstart' in window) ||
        navigator.maxTouchPoints > 0;


    /* ---------------------------------------------------------
       4. ÉLÉMENTS WEEBLY À PRÉSERVER
       --------------------------------------------------------- */

    var preservedSelectors = [
        '.wsite-form',
        '.wsite-nav',
        '.wsite-search-element',
        '.wsite-menu',
        '.wsite-footer'
    ];


    function isWeeblyElement(element) {

        if (!element) {
            return true;
        }

        try {

            if (
                element.closest &&
                element.closest(
                    preservedSelectors.join(',')
                )
            ) {
                return true;
            }

            var tag = element.tagName;

            if (
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                tag === 'SELECT' ||
                tag === 'BUTTON'
            ) {
                return true;
            }

            if (element.isContentEditable === true) {
                return true;
            }

        } catch (e) {}

        return false;
    }


    /* ---------------------------------------------------------
       5. ACTIVITÉ
       --------------------------------------------------------- */

    function registerActivity() {
        state.lastActivity = Date.now();
    }


    [
        'click',
        'keydown',
        'scroll',
        'touchstart'
    ].forEach(function (eventName) {

        document.addEventListener(
            eventName,
            registerActivity,
            true
        );

    });


    /* ---------------------------------------------------------
       6. RÉACTION DISCRÈTE
       --------------------------------------------------------- */

    function protectionReaction() {

        if (state.reacting) {
            return;
        }

        state.reacting = true;

        try {

            if (document.body) {

                document.body.classList.add(
                    'protection-lag'
                );

                setTimeout(function () {

                    try {

                        document.body.classList.remove(
                            'protection-lag'
                        );

                    } catch (e) {}

                    state.reacting = false;

                }, Math.floor(Math.random() * 650) + 400);

            } else {

                state.reacting = false;

            }

        } catch (e) {

            state.reacting = false;

        }
    }


    function registerAttempt() {

        state.attempts++;
        registerActivity();

        if (state.attempts >= 3) {
            protectionReaction();
        }
    }


    /* ---------------------------------------------------------
       7. CLIC DROIT
       --------------------------------------------------------- */

    document.addEventListener(
        'contextmenu',
        function (event) {

            if (
                isWeeblyElement(
                    event.target
                )
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            registerAttempt();

            return false;

        },
        true
    );


    /* ---------------------------------------------------------
       8. SÉLECTION
       --------------------------------------------------------- */

    document.addEventListener(
        'selectstart',
        function (event) {

            if (
                isWeeblyElement(
                    event.target
                )
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            return false;

        },
        true
    );


    /* ---------------------------------------------------------
       9. DRAG & DROP
       --------------------------------------------------------- */

    document.addEventListener(
        'dragstart',
        function (event) {

            if (
                isWeeblyElement(
                    event.target
                )
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            return false;

        },
        true
    );


    /* ---------------------------------------------------------
       10. RACCOURCIS DEVTOOLS / CODE SOURCE
       --------------------------------------------------------- */

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                isWeeblyElement(
                    event.target
                )
            ) {
                return;
            }

            var key =
                (event.key || '').toLowerCase();

            var blocked = false;


            /* F12 */

            if (event.key === 'F12') {
                blocked = true;
            }


            /* CTRL + SHIFT + I/J/C/K */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                ['i', 'j', 'c', 'k']
                    .indexOf(key) !== -1
            ) {
                blocked = true;
            }


            /* CTRL + U */

            if (
                event.ctrlKey &&
                key === 'u'
            ) {
                blocked = true;
            }


            /* CTRL + S */

            if (
                event.ctrlKey &&
                key === 's'
            ) {
                blocked = true;
            }


            /* CTRL + P */

            if (
                event.ctrlKey &&
                key === 'p'
            ) {
                blocked = true;
            }


            /* CTRL + ALT + I/J/C/K */

            if (
                event.ctrlKey &&
                event.altKey &&
                ['i', 'j', 'c', 'k']
                    .indexOf(key) !== -1
            ) {
                blocked = true;
            }


            /* CMD + ALT + I/J/C */

            if (
                event.metaKey &&
                event.altKey &&
                ['i', 'j', 'c']
                    .indexOf(key) !== -1
            ) {
                blocked = true;
            }


            if (blocked) {

                event.preventDefault();
                event.stopImmediatePropagation();

                registerAttempt();

                return false;
            }

        },
        true
    );


    /* ---------------------------------------------------------
       11. COPIE / COUPER
       --------------------------------------------------------- */

    function blockCopy(event) {

        if (
            isWeeblyElement(
                event.target
            )
        ) {
            return;
        }

        var selection = '';

        try {

            if (window.getSelection) {

                selection =
                    window.getSelection().toString();

            }

        } catch (e) {}


        /*
         * Seules les sélections importantes sont bloquées.
         * Cela évite les interférences inutiles.
         */

        if (selection.length > 40) {

            try {

                if (event.clipboardData) {

                    event.clipboardData.setData(
                        'text/plain',
                        ''
                    );

                }

            } catch (e) {}


            event.preventDefault();


            setTimeout(function () {

                try {

                    var currentSelection =
                        window.getSelection();

                    if (currentSelection) {

                        currentSelection
                            .removeAllRanges();

                    }

                } catch (e) {}

            }, 10);


            return false;
        }
    }


    document.addEventListener(
        'copy',
        blockCopy,
        true
    );

    document.addEventListener(
        'cut',
        blockCopy,
        true
    );


    /* ---------------------------------------------------------
       12. NETTOYAGE DE SÉLECTION
       --------------------------------------------------------- */

    document.addEventListener(
        'mousedown',
        function (event) {

            if (
                isWeeblyElement(
                    event.target
                )
            ) {
                return;
            }

            try {

                var selection =
                    window.getSelection();

                if (
                    selection &&
                    selection.toString().length
                ) {

                    selection.removeAllRanges();

                }

            } catch (e) {}

        },
        true
    );


    /* ---------------------------------------------------------
       13. IMPRESSION
       --------------------------------------------------------- */

    window.addEventListener(
        'beforeprint',
        function (event) {

            try {
                event.preventDefault();
            } catch (e) {}

        },
        true
    );


    try {

        window.print = function () {

            registerAttempt();

            return false;

        };

    } catch (e) {}


    /* ---------------------------------------------------------
       14. DÉTECTION DEVTOOLS PAR DIMENSIONS
       --------------------------------------------------------- */

    setInterval(function () {

        /*
         * IMPORTANT :
         * aucune détection de ce type sur tactile.
         * Cela évite les faux positifs liés aux barres
         * d'adresse mobiles, rotations et split-view.
         */

        if (isTouchDevice) {
            return;
        }

        try {

            var heightDifference =
                Math.abs(
                    window.outerHeight -
                    window.innerHeight
                );

            var widthDifference =
                Math.abs(
                    window.outerWidth -
                    window.innerWidth
                );


            if (
                heightDifference > 180 ||
                widthDifference > 180
            ) {

                state.devToolsHits++;


                /*
                 * Trois mesures consécutives.
                 */

                if (state.devToolsHits >= 3) {

                    state.devToolsHits = 0;
                    state.attempts++;


                    if (state.attempts >= 6) {

                        protectionReaction();

                    }

                }

            } else {

                state.devToolsHits = 0;

            }

        } catch (e) {}

    }, 3500);


    /* ---------------------------------------------------------
       15. VÉRIFICATION DIMENSIONS SECONDAIRE
       --------------------------------------------------------- */

    setInterval(function () {

        if (isTouchDevice) {
            return;
        }

        try {

            var widthGap =
                Math.abs(
                    window.outerWidth -
                    window.innerWidth
                );

            var heightGap =
                Math.abs(
                    window.outerHeight -
                    window.innerHeight
                );


            if (
                widthGap > 220 ||
                heightGap > 220
            ) {

                if (state.attempts > 1) {

                    protectionReaction();

                }

            }

        } catch (e) {}

    }, 7000);


    /* ---------------------------------------------------------
       16. EXTENSIONS DEVTOOLS
       --------------------------------------------------------- */

    setTimeout(function () {

        try {

            if (
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
                window.__VUE_DEVTOOLS_GLOBAL_HOOK__
            ) {

                protectionReaction();

            }

        } catch (e) {}

    }, 2500);


    /* ---------------------------------------------------------
       17. SURVEILLANCE DE L'INTÉGRITÉ
       --------------------------------------------------------- */

    var protectionReference =
        window.__WPX_CORE__;


    setInterval(function () {

        try {

            if (
                !window.__WPX_CORE__ ||
                window.__WPX_CORE__ !==
                protectionReference
            ) {

                location.reload();

            }

        } catch (e) {

            location.reload();

        }

    }, 6000);


    /* ---------------------------------------------------------
       18. RESET DU COMPTEUR
       --------------------------------------------------------- */

    setInterval(function () {

        try {

            if (
                Date.now() -
                state.lastActivity >
                60000
            ) {

                state.attempts = 0;

            }

        } catch (e) {}

    }, 30000);


    /* ---------------------------------------------------------
       19. AUTO-VÉRIFICATION
       --------------------------------------------------------- */

    setTimeout(function () {

        try {

            var descriptor =
                Object.getOwnPropertyDescriptor(
                    window,
                    '__WPX_CORE__'
                );


            if (
                !window.__WPX_CORE__ ||
                !descriptor ||
                descriptor.configurable !== false
            ) {

                location.reload();

            }

        } catch (e) {

            location.reload();

        }

    }, 4000);


})();
