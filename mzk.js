
(function () {

    // === CONFIGURATION ===
    var VALID_PASSWORDS = ['MZK_ODG93', 'MZK2026'];
    var MAX_ATTEMPTS = 3;
    var LOCKOUT_TIME = 300000;              // 5 minutes en ms
    var AUTH_DURATION = 3 * 60 * 60 * 1000; // 24h en ms - modifie cette valeur si besoin
    // Exemples : 1h = 60*60*1000 | 7 jours = 7*24*60*60*1000

    // === VÉRIFICATION D'AUTHENTIFICATION (partagée entre onglets/pages) ===
    function isAuthenticated() {
        var auth = localStorage.getItem('mzk_authenticated');
        var ts = localStorage.getItem('mzk_auth_timestamp');
        if (auth === 'true' && ts) {
            var elapsed = Date.now() - parseInt(ts, 10);
            if (elapsed < AUTH_DURATION) return true;
        }
        return false;
    }

    function reveal() {
        document.documentElement.style.visibility = 'visible';
    }

    // Si déjà authentifié (localStorage valide), on révèle direct, rien d'autre à faire
    if (isAuthenticated()) {
        reveal();
        return;
    }

     // Sinon on attend que le body existe pour construire l'overlay
    document.addEventListener('DOMContentLoaded', function () {
        try {
            buildOverlay();
        } catch (e) {
            console.error('Erreur overlay mot de passe :', e);
        }
        reveal(); // TOUJOURS exécuté, même si buildOverlay() a planté
    });

    // Filet de sécurité absolu : si pour une raison quelconque reveal()
    // n'a jamais été appelé (script cassé, DOMContentLoaded jamais déclenché...),
    // on force l'affichage après 3 secondes pour ne jamais laisser une page blanche.
    setTimeout(function () {
        document.documentElement.style.visibility = 'visible';
    }, 3000);

    function buildOverlay() {

        // === STYLES DE L'OVERLAY ===
        var style = document.createElement('style');
        style.textContent = `
#passwordOverlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, #1a4d3a, #0d2e1f, #2a5f47);
    z-index: 999999; display: flex; justify-content: center; align-items: center;
    backdrop-filter: blur(3px); animation: fadeIn 0.5s ease-out; overflow-y: auto;
}
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
.password-container {
    background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%);
    padding: 35px 30px 40px 30px; border-radius: 16px; border: 4px solid #ffff00;
    box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,0,0.7),
        0 0 60px rgba(255,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9),
        inset 0 -1px 0 rgba(0,0,0,0.05);
    text-align: center; max-width: 420px; width: 90%; position: relative;
    animation: slideIn 0.6s ease-out, glowPulse 3s infinite alternate; margin-top: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.password-container::before {
    content: ''; position: absolute; top:0; left:0; right:0; bottom:0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2374b9ff' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm15 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    pointer-events: none; z-index: -1;
}
@keyframes slideIn { from{opacity:0; transform:translateY(-40px) scale(0.85);} to{opacity:1; transform:translateY(0) scale(1);} }
@keyframes glowPulse {
    0% { box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,0,0.7), 0 0 60px rgba(255,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05); }
    100% { box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,0,0.9), 0 0 80px rgba(255,255,0,0.5), 0 0 100px rgba(255,255,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05); }
}
.password-container::after {
    content: '∫∑π'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; padding: 6px 14px;
    border-radius: 16px; font-size: 14px; font-weight: bold; letter-spacing: 1px;
    box-shadow: 0 4px 12px rgba(116,185,255,0.4); z-index: 10;
}
.password-title {
    font-size: 26px; font-weight: 700;
    background: linear-gradient(135deg, #2c3e50, #34495e);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin: 15px 0 8px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    line-height: 1.4 !important; overflow: visible !important;
}
.password-subtitle { color: #5d6d7e; margin-bottom: 30px; font-size: 14px; font-weight: 500; position: relative; }
.password-subtitle::after {
    content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
    width: 50px; height: 2px; background: linear-gradient(90deg, #74b9ff, #0984e3); border-radius: 1px;
}
.password-input-container { position: relative; width: 100%; margin-bottom: 20px; }
.password-input {
    width: 100%; padding: 16px 50px 16px 18px; border: 3px solid #e8f4fd; border-radius: 12px;
    font-size: 16px; font-weight: 500; transition: all 0.4s cubic-bezier(0.4,0,0.2,1); outline: none;
    background: linear-gradient(135deg, #ffffff, #f8f9fa);
    box-shadow: 0 4px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
    letter-spacing: 0.5px; box-sizing: border-box;
}
.password-input:focus {
    border-color: #74b9ff;
    box-shadow: 0 0 0 4px rgba(116,185,255,0.15), 0 8px 25px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
    transform: translateY(-1px);
}
.password-input::placeholder { color: #a0a8b0; font-weight: 400; }
.toggle-password {
    position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #74b9ff; font-size: 18px;
    padding: 5px; border-radius: 50%; transition: all 0.3s ease; z-index: 10;
    display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
}
.toggle-password:hover { background: rgba(116,185,255,0.1); color: #0984e3; transform: translateY(-50%) scale(1.1); }
.toggle-password:active { transform: translateY(-50%) scale(0.95); }
.eye-icon { width: 20px; height: 20px; fill: currentColor; transition: all 0.3s ease; }
.password-submit {
    width: 100%; padding: 16px 18px;
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #2d3436 100%);
    color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
    cursor: pointer; transition: all 0.4s cubic-bezier(0.4,0,0.2,1); margin-bottom: 15px;
    text-transform: uppercase; letter-spacing: 1px; position: relative; overflow: hidden;
    box-shadow: 0 8px 25px rgba(116,185,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}
.password-submit::before {
    content: ''; position: absolute; top:0; left:-100%; width:100%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.6s;
}
.password-submit:hover::before { left: 100%; }
.password-submit:hover {
    background: linear-gradient(135deg, #0984e3 0%, #2d3436 50%, #74b9ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(116,185,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
}
.password-submit:active {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(116,185,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}
.password-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message {
    color: #e74c3c; font-size: 14px; font-weight: 600; margin-top: 15px; opacity: 0;
    transition: all 0.4s ease; background: rgba(231,76,60,0.1); padding: 10px 15px;
    border-radius: 8px; border-left: 4px solid #e74c3c;
}
.error-message.show { opacity: 1; animation: shake 0.6s ease-in-out; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }
.attempts-counter {
    font-size: 13px; color: #7f8c8d; margin-top: 15px; padding: 8px 12px;
    background: rgba(127,140,141,0.1); border-radius: 6px; font-weight: 500;
}
.lockout-message {
    color: #e74c3c; font-size: 14px; font-weight: 600; margin-top: 15px; padding: 12px 15px;
    background: rgba(231,76,60,0.15); border-radius: 8px; border-left: 4px solid #e74c3c;
    border-right: 4px solid #e74c3c; text-align: center; animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{background:rgba(231,76,60,0.15); transform:scale(1);} 50%{background:rgba(231,76,60,0.25); transform:scale(1.02);} }
.unlock-animation { animation: unlockFade 0.8s ease-out forwards; }
@keyframes unlockFade { 0%{opacity:1; transform:scale(1);} 50%{transform:scale(1.05);} 100%{opacity:0; transform:scale(0.95); visibility:hidden;} }
@media (max-width: 480px) {
    .password-container { padding: 35px 25px; margin: 20px; max-width: 95%; }
    .password-title { font-size: 24px; }
    .password-input, .password-submit { padding: 16px 18px; font-size: 15px; }
    .password-input { padding-right: 50px; }
}
@media (max-height: 600px) {
    #passwordOverlay { padding: 10px; align-items: flex-start; justify-content: center; overflow-y: auto; }
    .password-container { padding: 25px 25px 30px 25px; margin: 15px auto; max-width: 380px; position: relative; top: 10px; }
    .password-title { font-size: 24px; margin: 12px 0 6px 0; }
    .password-subtitle { font-size: 13px; margin-bottom: 22px; }
    .password-input { padding: 14px 45px 14px 16px; font-size: 15px; }
    .password-input-container { margin-bottom: 18px; }
    .password-submit { padding: 14px 16px; font-size: 15px; margin-bottom: 12px; }
}
        `;
        document.head.appendChild(style);

        // === MARKUP DE L'OVERLAY ===
        var overlay = document.createElement('div');
        overlay.id = 'passwordOverlay';
        overlay.innerHTML =
            '<div class="password-container">' +
                '<div class="password-title">Accès réservé</div>' +
                '<div class="password-subtitle">Veuillez entrer le mot de passe pour continuer</div>' +
                '<form id="passwordForm">' +
                    '<div class="password-input-container">' +
                        '<input type="password" id="passwordInput" class="password-input" placeholder="Mot de passe" autocomplete="off" maxlength="50">' +
                        '<button type="button" class="toggle-password" id="togglePassword">' +
                            '<svg class="eye-icon" id="eyeIcon" viewBox="0 0 24 24">' +
                                '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                    '<button type="submit" class="password-submit">Accéder au site</button>' +
                '</form>' +
                '<div id="errorMessage" class="error-message">Mot de passe incorrect</div>' +
                '<div id="lockoutMessage" class="lockout-message" style="display:none;"></div>' +
                '<div id="attemptsCounter" class="attempts-counter">Tentatives restantes: <span id="remainingAttempts">3</span></div>' +
            '</div>';

        // Insérer l'overlay en tout premier dans le body
        document.body.insertBefore(overlay, document.body.firstChild);

        // === RÉCUPÉRATION DES ÉLÉMENTS ===
        var form = document.getElementById('passwordForm');
        var input = document.getElementById('passwordInput');
        var errorMsg = document.getElementById('errorMessage');
        var lockoutMsg = document.getElementById('lockoutMessage');
        var attemptsCounter = document.getElementById('attemptsCounter');
        var remainingSpan = document.getElementById('remainingAttempts');
        var togglePassword = document.getElementById('togglePassword');
        var eyeIcon = document.getElementById('eyeIcon');
        var submitBtn = document.querySelector('.password-submit');

        var attempts = 0;
        var isLocked = false;
        var lockoutInterval = null;

        checkLockout();
        input.focus();

        form.addEventListener('submit', handleFormSubmit);
        togglePassword.addEventListener('click', togglePasswordVisibility);

        function togglePasswordVisibility() {
            var type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            if (type === 'text') {
                eyeIcon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>';
            } else {
                eyeIcon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
            }
        }

        function handleFormSubmit(e) {
            e.preventDefault();
            if (isLocked) { showLockoutMessage(); return; }

            var password = input.value.trim();
            if (VALID_PASSWORDS.indexOf(password) !== -1) {
                unlockSite();
            } else {
                attempts++;
                if (attempts >= MAX_ATTEMPTS) {
                    lockOut();
                } else {
                    showError('Mot de passe incorrect');
                    remainingSpan.textContent = MAX_ATTEMPTS - attempts;
                    input.value = '';
                    input.focus();
                }
            }
        }

        function unlockSite() {
            // Authentification partagée entre tous les onglets/pages du site
            localStorage.setItem('mzk_authenticated', 'true');
            localStorage.setItem('mzk_auth_timestamp', Date.now().toString());

            overlay.classList.add('unlock-animation');
            setTimeout(function () {
                overlay.remove();
            }, 800);
        }

        function showError(message) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            var container = document.querySelector('.password-container');
            container.style.animation = 'shake 0.6s ease-in-out';
            setTimeout(function () {
                container.style.transition = 'transform 0.1s ease-out';
                container.style.animation = 'none';
                container.style.transform = 'translateX(0)';
                setTimeout(function () {
                    container.style.transition = '';
                    container.style.transform = '';
                }, 100);
            }, 600);
            setTimeout(function () { errorMsg.classList.remove('show'); }, 5000);
        }

        function lockOut() {
            isLocked = true;
            localStorage.setItem('mzk_lockoutTime', Date.now().toString());
            attemptsCounter.style.display = 'none';
            showError('Trop de tentatives. Accès bloqué pour ' + (LOCKOUT_TIME / 60000) + ' minutes.');
            showLockoutMessage();
            input.disabled = true;
            input.value = '';
            submitBtn.disabled = true;
            setTimeout(resetAttempts, LOCKOUT_TIME);
        }

        function showLockoutMessage() {
            var lockoutTime = localStorage.getItem('mzk_lockoutTime');
            if (lockoutTime) {
                var timePassed = Date.now() - parseInt(lockoutTime, 10);
                var remainingTime = Math.ceil((LOCKOUT_TIME - timePassed) / 60000);
                if (remainingTime > 0) {
                    lockoutMsg.innerHTML = '&#x1F6AB; Trop de tentatives. Réessayez dans ' + remainingTime + ' minute' + (remainingTime > 1 ? 's' : '') + '.';
                    lockoutMsg.style.display = 'block';
                    if (lockoutInterval) clearInterval(lockoutInterval);
                    lockoutInterval = setInterval(function () {
                        var t = Date.now() - parseInt(lockoutTime, 10);
                        var r = Math.ceil((LOCKOUT_TIME - t) / 60000);
                        if (r > 0) {
                            lockoutMsg.textContent = 'Trop de tentatives. Réessayez dans ' + r + ' minute' + (r > 1 ? 's' : '') + '.';
                        } else {
                            clearInterval(lockoutInterval);
                            lockoutMsg.style.display = 'none';
                        }
                    }, 60000);
                } else {
                    lockoutMsg.style.display = 'none';
                }
            }
        }

        function checkLockout() {
            var lockoutTime = localStorage.getItem('mzk_lockoutTime');
            if (lockoutTime) {
                var timePassed = Date.now() - parseInt(lockoutTime, 10);
                if (timePassed < LOCKOUT_TIME) {
                    var remainingTime = Math.ceil((LOCKOUT_TIME - timePassed) / 60000);
                    isLocked = true;
                    attemptsCounter.style.display = 'none';
                    showError('Accès bloqué. Réessayez dans ' + remainingTime + ' minutes.');
                    showLockoutMessage();
                    input.disabled = true;
                    submitBtn.disabled = true;
                    setTimeout(resetAttempts, LOCKOUT_TIME - timePassed);
                } else {
                    resetAttempts();
                }
            }
        }

        function resetAttempts() {
            attempts = 0;
            isLocked = false;
            localStorage.removeItem('mzk_lockoutTime');
            if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
            input.disabled = false;
            submitBtn.disabled = false;
            remainingSpan.textContent = MAX_ATTEMPTS;
            attemptsCounter.style.display = 'block';
            lockoutMsg.style.display = 'none';
            input.focus();
        }
    }

    // === SÉCURITÉ SUPPLÉMENTAIRE (optionnel) ===
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();
