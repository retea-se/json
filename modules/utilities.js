/**
 * JSON Toolbox - Utilities Module
 * URL encode/decode, Base64, escape/unescape, string utilities
 */
(function() {
    'use strict';

    const MODULE_NAME = 'utilities';
    let initialized = false;

    // Get translations
    function t(key) {
        return (window.i18n && window.i18n[key]) || key;
    }

    function init() {
        if (initialized) return;
        
        const container = document.getElementById('content-utilities');
        if (!container) return;

        container.innerHTML = `
            <div class="utilities-module">
                <div class="utilities-grid">
                    <div class="utilities-input-section">
                        <div class="section-header">
                            <label for="utilities-input">${t('utilities_input')}</label>
                            <div class="section-actions">
                                <button type="button" class="btn btn-sm" id="utilities-paste" title="${t('paste')}">
                                    <i data-lucide="clipboard-paste"></i>
                                </button>
                                <button type="button" class="btn btn-sm" id="utilities-clear" title="${t('clear')}">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                        <textarea id="utilities-input" class="code-input" placeholder='${t('utilities_placeholder')}'></textarea>
                    </div>
                    
                    <div class="utilities-output-section">
                        <div class="section-header">
                            <label for="utilities-output">${t('utilities_output')}</label>
                            <div class="section-actions">
                                <button type="button" class="btn btn-sm" id="utilities-copy" title="${t('copy')}">
                                    <i data-lucide="copy"></i>
                                </button>
                                <button type="button" class="btn btn-sm" id="utilities-swap" title="${t('utilities_swap')}">
                                    <i data-lucide="arrow-right-left"></i>
                                </button>
                            </div>
                        </div>
                        <textarea id="utilities-output" class="code-output" readonly placeholder="${t('utilities_output_placeholder')}"></textarea>
                    </div>
                </div>
                
                <div class="utilities-tools">
                    <div class="tool-section">
                        <h4><i data-lucide="link"></i> URL</h4>
                        <div class="tool-buttons">
                            <button type="button" class="btn btn-secondary" data-action="url-encode">
                                <i data-lucide="lock"></i> ${t('utilities_url_encode')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="url-decode">
                                <i data-lucide="lock-open"></i> ${t('utilities_url_decode')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="url-encode-component">
                                <i data-lucide="lock"></i> ${t('utilities_url_encode_component')}
                            </button>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h4><i data-lucide="file-code"></i> Base64</h4>
                        <div class="tool-buttons">
                            <button type="button" class="btn btn-secondary" data-action="base64-encode">
                                <i data-lucide="arrow-right"></i> ${t('utilities_base64_encode')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="base64-decode">
                                <i data-lucide="arrow-left"></i> ${t('utilities_base64_decode')}
                            </button>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h4><i data-lucide="code"></i> JSON String</h4>
                        <div class="tool-buttons">
                            <button type="button" class="btn btn-secondary" data-action="json-escape">
                                <i data-lucide="quote"></i> ${t('utilities_json_escape')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="json-unescape">
                                <i data-lucide="quote"></i> ${t('utilities_json_unescape')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="json-stringify">
                                <i data-lucide="align-left"></i> ${t('utilities_stringify')}
                            </button>
                        </div>
                    </div>
                    
                    <div class="tool-section">
                        <h4><i data-lucide="text"></i> ${t('utilities_text')}</h4>
                        <div class="tool-buttons">
                            <button type="button" class="btn btn-secondary" data-action="html-encode">
                                <i data-lucide="code"></i> ${t('utilities_html_encode')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="html-decode">
                                <i data-lucide="file-text"></i> ${t('utilities_html_decode')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="unicode-escape">
                                <i data-lucide="globe"></i> ${t('utilities_unicode_escape')}
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="unicode-unescape">
                                <i data-lucide="type"></i> ${t('utilities_unicode_unescape')}
                            </button>
                        </div>
                    </div>

                    <div class="tool-section">
                        <h4><i data-lucide="calculator"></i> ${t('utilities_hash')}</h4>
                        <div class="tool-buttons">
                            <button type="button" class="btn btn-secondary" data-action="hash-sha256">
                                <i data-lucide="hash"></i> SHA-256
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="hash-sha1">
                                <i data-lucide="hash"></i> SHA-1
                            </button>
                            <button type="button" class="btn btn-secondary" data-action="hash-md5">
                                <i data-lucide="hash"></i> MD5
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="utilities-status" class="module-status"></div>
            </div>
        `;

        bindEvents();
        addStyles();
        window.JSONToolbox?.refreshIcons(container);
        restoreState();
        initialized = true;
    }

    function bindEvents() {
        const input = document.getElementById('utilities-input');
        const copyBtn = document.getElementById('utilities-copy');
        const clearBtn = document.getElementById('utilities-clear');
        const pasteBtn = document.getElementById('utilities-paste');
        const swapBtn = document.getElementById('utilities-swap');

        // Tool buttons
        document.querySelectorAll('.utilities-tools [data-action]').forEach(btn => {
            btn.addEventListener('click', () => handleAction(btn.dataset.action));
        });

        copyBtn?.addEventListener('click', copyOutput);
        clearBtn?.addEventListener('click', clearAll);
        pasteBtn?.addEventListener('click', pasteInput);
        swapBtn?.addEventListener('click', swapInputOutput);

        // Save state on input change
        input?.addEventListener('input', saveState);

        // Drag and drop
        input?.addEventListener('dragover', (e) => {
            e.preventDefault();
            input.classList.add('drag-over');
        });

        input?.addEventListener('dragleave', () => {
            input.classList.remove('drag-over');
        });

        input?.addEventListener('drop', (e) => {
            e.preventDefault();
            input.classList.remove('drag-over');
            
            const file = e.dataTransfer?.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    input.value = event.target.result;
                    saveState();
                };
                reader.readAsText(file);
            } else if (e.dataTransfer?.getData('text')) {
                input.value = e.dataTransfer.getData('text');
                saveState();
            }
        });
    }

    function handleAction(action) {
        const input = document.getElementById('utilities-input');
        const output = document.getElementById('utilities-output');
        
        if (!input?.value.trim()) {
            showStatus('error', t('error_empty_input'));
            return;
        }

        try {
            let result;
            switch (action) {
                case 'url-encode':
                    result = encodeURI(input.value);
                    break;
                case 'url-decode':
                    result = decodeURI(input.value);
                    break;
                case 'url-encode-component':
                    result = encodeURIComponent(input.value);
                    break;
                case 'base64-encode':
                    result = btoa(unescape(encodeURIComponent(input.value)));
                    break;
                case 'base64-decode':
                    result = decodeURIComponent(escape(atob(input.value)));
                    break;
                case 'json-escape':
                    result = JSON.stringify(input.value);
                    break;
                case 'json-unescape':
                    result = JSON.parse(input.value);
                    break;
                case 'json-stringify':
                    // Parse and re-stringify with formatting
                    const parsed = JSON.parse(input.value);
                    result = JSON.stringify(parsed, null, 2);
                    break;
                case 'html-encode':
                    result = htmlEncode(input.value);
                    break;
                case 'html-decode':
                    result = htmlDecode(input.value);
                    break;
                case 'unicode-escape':
                    result = unicodeEscape(input.value);
                    break;
                case 'unicode-unescape':
                    result = unicodeUnescape(input.value);
                    break;
                case 'hash-sha256':
                    hashText(input.value, 'SHA-256').then(hash => {
                        output.value = hash;
                        showStatus('success', t('utilities_hash_success'));
                    });
                    return;
                case 'hash-sha1':
                    hashText(input.value, 'SHA-1').then(hash => {
                        output.value = hash;
                        showStatus('success', t('utilities_hash_success'));
                    });
                    return;
                case 'hash-md5':
                    // MD5 not available in SubtleCrypto, use simple implementation
                    result = simpleMD5(input.value);
                    break;
                default:
                    showStatus('error', t('utilities_unknown_action'));
                    return;
            }

            output.value = result;
            showStatus('success', t('utilities_success'));
            if (window.JTA) window.JTA.trackSuccess('utilities', action);
        } catch (e) {
            showStatus('error', `${t('error')}: ${e.message}`);
            if (window.JTA) window.JTA.trackError('utilities', action, e.message);
        }
    }

    function htmlEncode(str) {
        const el = document.createElement('div');
        el.textContent = str;
        return el.innerHTML;
    }

    function htmlDecode(str) {
        const el = document.createElement('textarea');
        el.innerHTML = str;
        return el.value;
    }

    function unicodeEscape(str) {
        return str.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code > 127) {
                return '\\u' + code.toString(16).padStart(4, '0');
            }
            return char;
        }).join('');
    }

    function unicodeUnescape(str) {
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
            return String.fromCharCode(parseInt(code, 16));
        });
    }

    async function hashText(text, algorithm) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Simple MD5 implementation (for completeness - not cryptographically secure)
    function simpleMD5(string) {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }

        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }

        function ff(a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }

        function gg(a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }

        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }

        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        }

        function md51(s) {
            var n = s.length,
                state = [1732584193, -271733879, -1732584194, 271733878], i;
            for (i = 64; i <= s.length; i += 64) {
                md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < s.length; i++)
                tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i++) tail[i] = 0;
            }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }

        function md5blk(s) {
            var md5blks = [], i;
            for (i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = s.charCodeAt(i) +
                    (s.charCodeAt(i + 1) << 8) +
                    (s.charCodeAt(i + 2) << 16) +
                    (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
        }

        var hex_chr = '0123456789abcdef'.split('');

        function rhex(n) {
            var s = '', j = 0;
            for (; j < 4; j++)
                s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] +
                    hex_chr[(n >> (j * 8)) & 0x0F];
            return s;
        }

        function hex(x) {
            for (var i = 0; i < x.length; i++)
                x[i] = rhex(x[i]);
            return x.join('');
        }

        function add32(a, b) {
            return (a + b) & 0xFFFFFFFF;
        }

        return hex(md51(string));
    }

    async function copyOutput() {
        const output = document.getElementById('utilities-output');
        if (!output?.value) {
            showStatus('error', t('error_nothing_to_copy'));
            return;
        }

        try {
            await navigator.clipboard.writeText(output.value);
            showStatus('success', t('copied'));
            if (window.JTA) window.JTA.trackCopy('utilities');
        } catch (e) {
            showStatus('error', t('error_copy_failed'));
        }
    }

    function clearAll() {
        const input = document.getElementById('utilities-input');
        const output = document.getElementById('utilities-output');
        if (input) input.value = '';
        if (output) output.value = '';
        saveState();
        showStatus('info', t('cleared'));
    }

    async function pasteInput() {
        try {
            const text = await navigator.clipboard.readText();
            const input = document.getElementById('utilities-input');
            if (input) {
                input.value = text;
                saveState();
            }
        } catch (e) {
            showStatus('error', t('error_paste_failed'));
        }
    }

    function swapInputOutput() {
        const input = document.getElementById('utilities-input');
        const output = document.getElementById('utilities-output');
        
        if (input && output) {
            const temp = input.value;
            input.value = output.value;
            output.value = temp;
            saveState();
        }
    }

    function showStatus(type, message) {
        const status = document.getElementById('utilities-status');
        if (!status) return;

        status.className = `module-status status-${type}`;
        const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
        status.innerHTML = `<i data-lucide="${iconName}"></i> ${message}`;
        window.JSONToolbox?.refreshIcons(status);

        setTimeout(() => {
            status.className = 'module-status';
            status.innerHTML = '';
        }, 3000);
    }

    function saveState() {
        const input = document.getElementById('utilities-input');
        window.JSONToolbox?.saveToStorage('utilities-input', input?.value || '');
    }

    function restoreState() {
        const input = document.getElementById('utilities-input');
        const savedInput = window.JSONToolbox?.loadFromStorage('utilities-input');
        if (input && savedInput) input.value = savedInput;
    }

    function addStyles() {
        if (document.getElementById('utilities-module-styles')) return;

        const style = document.createElement('style');
        style.id = 'utilities-module-styles';
        style.textContent = `
            .utilities-module {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                height: 100%;
            }

            .utilities-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                flex: 1;
                min-height: 200px;
            }

            .utilities-input-section,
            .utilities-output-section {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .utilities-input-section textarea,
            .utilities-output-section textarea {
                flex: 1;
                min-height: 150px;
                resize: vertical;
            }

            .utilities-tools {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }

            .tool-section {
                background: var(--bg-secondary);
                padding: 1rem;
                border-radius: var(--radius);
            }

            .tool-section h4 {
                margin: 0 0 0.75rem 0;
                font-size: 0.875rem;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .tool-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .tool-buttons .btn {
                font-size: 0.8125rem;
                padding: 0.375rem 0.75rem;
            }

            @media (max-width: 768px) {
                .utilities-grid {
                    grid-template-columns: 1fr;
                }

                .utilities-tools {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Export for external access
    window.UtilitiesModule = { init };

    // Initialize on tab change
    window.addEventListener('jsontoolbox:tabchange', (e) => {
        if (e.detail.tab === MODULE_NAME) {
            init();
        }
    });

    // Initialize if already on this tab
    if (document.querySelector('.json-toolbox__tab--active[data-tab="utilities"]')) {
        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
    }
})();
