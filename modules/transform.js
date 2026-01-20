/**
 * JSON Toolbox - Transform Module
 * TypeScript interface generation from JSON
 */
(function() {
    'use strict';

    const MODULE_NAME = 'transform';
    let initialized = false;

    // Get translations
    function t(key) {
        return (window.i18n && window.i18n[key]) || key;
    }

    function init() {
        if (initialized) return;
        
        const container = document.getElementById('content-transform');
        if (!container) return;

        container.innerHTML = `
            <div class="transform-module">
                <div class="transform-grid">
                    <div class="transform-input-section">
                        <div class="section-header">
                            <label for="transform-input">${t('transform_input')}</label>
                            <div class="section-actions">
                                <button type="button" class="btn btn-sm" id="transform-paste" title="${t('paste')}">
                                    <i data-lucide="clipboard-paste"></i>
                                </button>
                                <button type="button" class="btn btn-sm" id="transform-sample" title="${t('load_sample')}">
                                    <i data-lucide="file-code"></i>
                                </button>
                                <button type="button" class="btn btn-sm" id="transform-clear" title="${t('clear')}">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                        <textarea id="transform-input" class="code-input" placeholder='${t('transform_placeholder')}'></textarea>
                    </div>
                    
                    <div class="transform-output-section">
                        <div class="section-header">
                            <label for="transform-output">${t('transform_output')}</label>
                            <div class="section-actions">
                                <button type="button" class="btn btn-sm" id="transform-copy" title="${t('copy')}">
                                    <i data-lucide="copy"></i>
                                </button>
                                <button type="button" class="btn btn-sm" id="transform-download" title="${t('download')}">
                                    <i data-lucide="download"></i>
                                </button>
                            </div>
                        </div>
                        <textarea id="transform-output" class="code-output" readonly placeholder="${t('transform_output_placeholder')}"></textarea>
                    </div>
                </div>
                
                <div class="transform-options">
                    <div class="options-row">
                        <div class="option-group">
                            <label for="transform-type">${t('transform_type')}</label>
                            <select id="transform-type" class="form-select">
                                <option value="typescript">${t('transform_typescript_interface')}</option>
                                <option value="typescript-type">${t('transform_typescript_type')}</option>
                                <option value="jsdoc">${t('transform_jsdoc')}</option>
                                <option value="golang">${t('transform_go_struct')}</option>
                                <option value="python">${t('transform_python_dataclass')}</option>
                            </select>
                        </div>
                        
                        <div class="option-group">
                            <label for="transform-root-name">${t('transform_root_name')}</label>
                            <input type="text" id="transform-root-name" class="form-input" value="RootObject" placeholder="RootObject">
                        </div>
                        
                        <div class="option-group options-checkboxes">
                            <label class="checkbox-label">
                                <input type="checkbox" id="transform-optional" checked>
                                <span>${t('transform_optional')}</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="transform-export" checked>
                                <span>${t('transform_export')}</span>
                            </label>
                        </div>
                    </div>
                    
                    <button type="button" class="btn btn-primary" id="transform-generate">
                        <i data-lucide="settings"></i> ${t('transform_generate')}
                    </button>
                </div>
                
                <div id="transform-status" class="module-status"></div>
            </div>
        `;

        bindEvents();
        addStyles();
        window.JSONToolbox?.refreshIcons(container);
        restoreState();
        initialized = true;
    }

    function bindEvents() {
        const input = document.getElementById('transform-input');
        const output = document.getElementById('transform-output');
        const generateBtn = document.getElementById('transform-generate');
        const copyBtn = document.getElementById('transform-copy');
        const clearBtn = document.getElementById('transform-clear');
        const pasteBtn = document.getElementById('transform-paste');
        const sampleBtn = document.getElementById('transform-sample');
        const downloadBtn = document.getElementById('transform-download');
        const typeSelect = document.getElementById('transform-type');
        const rootNameInput = document.getElementById('transform-root-name');
        const optionalCheckbox = document.getElementById('transform-optional');
        const exportCheckbox = document.getElementById('transform-export');

        generateBtn?.addEventListener('click', generate);
        copyBtn?.addEventListener('click', copyOutput);
        clearBtn?.addEventListener('click', clearAll);
        pasteBtn?.addEventListener('click', pasteInput);
        sampleBtn?.addEventListener('click', loadSample);
        downloadBtn?.addEventListener('click', downloadOutput);

        // Save state on input change
        input?.addEventListener('input', saveState);
        typeSelect?.addEventListener('change', saveState);
        rootNameInput?.addEventListener('input', saveState);
        optionalCheckbox?.addEventListener('change', saveState);
        exportCheckbox?.addEventListener('change', saveState);

        // Keyboard shortcut
        input?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                generate();
            }
        });

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
            if (file && file.type === 'application/json') {
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

    function generate() {
        const input = document.getElementById('transform-input');
        const output = document.getElementById('transform-output');
        const typeSelect = document.getElementById('transform-type');
        const rootNameInput = document.getElementById('transform-root-name');
        const optionalCheckbox = document.getElementById('transform-optional');
        const exportCheckbox = document.getElementById('transform-export');

        if (!input?.value.trim()) {
            showStatus('error', t('error_empty_input'));
            return;
        }

        try {
            const json = JSON.parse(input.value);
            const options = {
                rootName: rootNameInput?.value || 'RootObject',
                optional: optionalCheckbox?.checked ?? true,
                exportKeyword: exportCheckbox?.checked ?? true
            };

            let result;
            switch (typeSelect?.value) {
                case 'typescript':
                    result = generateTypeScript(json, options, false);
                    break;
                case 'typescript-type':
                    result = generateTypeScript(json, options, true);
                    break;
                case 'jsdoc':
                    result = generateJSDoc(json, options);
                    break;
                case 'golang':
                    result = generateGoStruct(json, options);
                    break;
                case 'python':
                    result = generatePythonDataclass(json, options);
                    break;
                default:
                    result = generateTypeScript(json, options, false);
            }

            output.value = result;
            // Analytics: track successful transform
            if (window.JTA) {
                window.JTA.trackSuccess('transform', typeSelect?.value || 'typescript');
            }
            showStatus('success', t('transform_success'));
        } catch (e) {
            // Analytics: track error
            if (window.JTA) {
                window.JTA.trackError('transform', 'parse');
            }
            showStatus('error', `${t('error_invalid_json')}: ${e.message}`);
        }
    }

    function generateTypeScript(json, options, useType = false) {
        const interfaces = [];
        const generatedNames = new Set();

        function getTypeName(name, isArray = false) {
            let typeName = name.charAt(0).toUpperCase() + name.slice(1);
            // Handle plural to singular for arrays
            if (isArray && typeName.endsWith('s')) {
                typeName = typeName.slice(0, -1);
            }
            // Ensure unique names
            let finalName = typeName;
            let counter = 1;
            while (generatedNames.has(finalName)) {
                finalName = `${typeName}${counter++}`;
            }
            generatedNames.add(finalName);
            return finalName;
        }

        function inferType(value, propName = 'item') {
            if (value === null) return 'null';
            if (Array.isArray(value)) {
                if (value.length === 0) return 'unknown[]';
                const itemType = inferType(value[0], propName);
                return `${itemType}[]`;
            }
            switch (typeof value) {
                case 'string': return 'string';
                case 'number': return Number.isInteger(value) ? 'number' : 'number';
                case 'boolean': return 'boolean';
                case 'object': {
                    const typeName = getTypeName(propName);
                    generateInterface(value, typeName);
                    return typeName;
                }
                default: return 'unknown';
            }
        }

        function generateInterface(obj, name) {
            const keyword = useType ? 'type' : 'interface';
            const exportStr = options.exportKeyword ? 'export ' : '';
            const optional = options.optional ? '?' : '';
            
            const props = Object.entries(obj).map(([key, value]) => {
                const type = inferType(value, key);
                const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
                return `  ${safeKey}${optional}: ${type};`;
            });

            if (useType) {
                interfaces.push(`${exportStr}type ${name} = {\n${props.join('\n')}\n};`);
            } else {
                interfaces.push(`${exportStr}interface ${name} {\n${props.join('\n')}\n}`);
            }
        }

        // Handle root level
        if (Array.isArray(json)) {
            if (json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
                generateInterface(json[0], options.rootName);
                return `// Array of ${options.rootName}\n${interfaces.reverse().join('\n\n')}`;
            }
            return `// Array type\n${options.exportKeyword ? 'export ' : ''}type ${options.rootName} = ${inferType(json[0])}[];`;
        } else if (typeof json === 'object' && json !== null) {
            generateInterface(json, options.rootName);
            return interfaces.reverse().join('\n\n');
        } else {
            return `${options.exportKeyword ? 'export ' : ''}type ${options.rootName} = ${inferType(json)};`;
        }
    }

    function generateJSDoc(json, options) {
        const typedefs = [];
        const generatedNames = new Set();

        function getTypeName(name) {
            let typeName = name.charAt(0).toUpperCase() + name.slice(1);
            let finalName = typeName;
            let counter = 1;
            while (generatedNames.has(finalName)) {
                finalName = `${typeName}${counter++}`;
            }
            generatedNames.add(finalName);
            return finalName;
        }

        function inferType(value, propName = 'item') {
            if (value === null) return 'null';
            if (Array.isArray(value)) {
                if (value.length === 0) return 'Array<*>';
                const itemType = inferType(value[0], propName);
                return `Array<${itemType}>`;
            }
            switch (typeof value) {
                case 'string': return 'string';
                case 'number': return 'number';
                case 'boolean': return 'boolean';
                case 'object': {
                    const typeName = getTypeName(propName);
                    generateTypedef(value, typeName);
                    return typeName;
                }
                default: return '*';
            }
        }

        function generateTypedef(obj, name) {
            const props = Object.entries(obj).map(([key, value]) => {
                const type = inferType(value, key);
                return ` * @property {${type}} ${options.optional ? `[${key}]` : key}`;
            });

            typedefs.push(`/**\n * @typedef {Object} ${name}\n${props.join('\n')}\n */`);
        }

        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
            generateTypedef(json[0], options.rootName);
        } else if (typeof json === 'object' && json !== null) {
            generateTypedef(json, options.rootName);
        }

        return typedefs.reverse().join('\n\n');
    }

    function generateGoStruct(json, options) {
        const structs = [];
        const generatedNames = new Set();

        function getTypeName(name) {
            let typeName = name.charAt(0).toUpperCase() + name.slice(1);
            let finalName = typeName;
            let counter = 1;
            while (generatedNames.has(finalName)) {
                finalName = `${typeName}${counter++}`;
            }
            generatedNames.add(finalName);
            return finalName;
        }

        function toPascalCase(str) {
            return str.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
        }

        function inferType(value, propName = 'item') {
            if (value === null) return 'interface{}';
            if (Array.isArray(value)) {
                if (value.length === 0) return '[]interface{}';
                const itemType = inferType(value[0], propName);
                return `[]${itemType}`;
            }
            switch (typeof value) {
                case 'string': return 'string';
                case 'number': return Number.isInteger(value) ? 'int' : 'float64';
                case 'boolean': return 'bool';
                case 'object': {
                    const typeName = getTypeName(propName);
                    generateStruct(value, typeName);
                    return typeName;
                }
                default: return 'interface{}';
            }
        }

        function generateStruct(obj, name) {
            const fields = Object.entries(obj).map(([key, value]) => {
                const type = inferType(value, key);
                const fieldName = toPascalCase(key);
                const omitempty = options.optional ? ',omitempty' : '';
                return `\t${fieldName} ${type} \`json:"${key}${omitempty}"\``;
            });

            structs.push(`type ${name} struct {\n${fields.join('\n')}\n}`);
        }

        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
            generateStruct(json[0], options.rootName);
        } else if (typeof json === 'object' && json !== null) {
            generateStruct(json, options.rootName);
        }

        return structs.reverse().join('\n\n');
    }

    function generatePythonDataclass(json, options) {
        const classes = [];
        const generatedNames = new Set();

        function getTypeName(name) {
            let typeName = name.charAt(0).toUpperCase() + name.slice(1);
            let finalName = typeName;
            let counter = 1;
            while (generatedNames.has(finalName)) {
                finalName = `${typeName}${counter++}`;
            }
            generatedNames.add(finalName);
            return finalName;
        }

        function toSnakeCase(str) {
            return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        }

        function inferType(value, propName = 'item') {
            if (value === null) return 'None';
            if (Array.isArray(value)) {
                if (value.length === 0) return 'list';
                const itemType = inferType(value[0], propName);
                return `list[${itemType}]`;
            }
            switch (typeof value) {
                case 'string': return 'str';
                case 'number': return Number.isInteger(value) ? 'int' : 'float';
                case 'boolean': return 'bool';
                case 'object': {
                    const typeName = getTypeName(propName);
                    generateClass(value, typeName);
                    return typeName;
                }
                default: return 'Any';
            }
        }

        function generateClass(obj, name) {
            const fields = Object.entries(obj).map(([key, value]) => {
                const type = inferType(value, key);
                const fieldName = toSnakeCase(key);
                const optionalType = options.optional ? `Optional[${type}]` : type;
                const defaultVal = options.optional ? ' = None' : '';
                return `    ${fieldName}: ${optionalType}${defaultVal}`;
            });

            classes.push(`@dataclass\nclass ${name}:\n${fields.join('\n')}`);
        }

        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
            generateClass(json[0], options.rootName);
        } else if (typeof json === 'object' && json !== null) {
            generateClass(json, options.rootName);
        }

        const imports = 'from dataclasses import dataclass\nfrom typing import Optional, Any\n\n';
        return imports + classes.reverse().join('\n\n');
    }

    async function copyOutput() {
        const output = document.getElementById('transform-output');
        if (!output?.value) {
            showStatus('error', t('error_nothing_to_copy'));
            return;
        }

        try {
            await navigator.clipboard.writeText(output.value);
            // Analytics: track copy
            if (window.JTA) {
                window.JTA.trackCopy('transform');
            }
            showStatus('success', t('copied'));
        } catch (e) {
            showStatus('error', t('error_copy_failed'));
        }
    }

    function clearAll() {
        const input = document.getElementById('transform-input');
        const output = document.getElementById('transform-output');
        if (input) input.value = '';
        if (output) output.value = '';
        saveState();
        showStatus('info', t('cleared'));
    }

    async function pasteInput() {
        try {
            const text = await navigator.clipboard.readText();
            const input = document.getElementById('transform-input');
            if (input) {
                input.value = text;
                saveState();
            }
        } catch (e) {
            showStatus('error', t('error_paste_failed'));
        }
    }

    function loadSample() {
        const sample = {
            "id": 12345,
            "name": "John Doe",
            "email": "john@example.com",
            "isActive": true,
            "balance": 1234.56,
            "tags": ["developer", "admin"],
            "address": {
                "street": "123 Main St",
                "city": "Stockholm",
                "country": "Sweden",
                "postalCode": "12345"
            },
            "orders": [
                {
                    "orderId": "ORD-001",
                    "amount": 99.99,
                    "items": ["Widget A", "Widget B"]
                }
            ],
            "metadata": null
        };

        const input = document.getElementById('transform-input');
        if (input) {
            input.value = JSON.stringify(sample, null, 2);
            saveState();
        }
    }

    function downloadOutput() {
        const output = document.getElementById('transform-output');
        const typeSelect = document.getElementById('transform-type');
        
        if (!output?.value) {
            showStatus('error', t('error_nothing_to_download'));
            return;
        }

        const extensions = {
            'typescript': 'ts',
            'typescript-type': 'ts',
            'jsdoc': 'js',
            'golang': 'go',
            'python': 'py'
        };

        const ext = extensions[typeSelect?.value] || 'txt';
        const blob = new Blob([output.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `types.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        // Analytics: track download
        if (window.JTA) {
            window.JTA.trackDownload('transform', ext);
        }
    }

    function showStatus(type, message) {
        const status = document.getElementById('transform-status');
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
        const input = document.getElementById('transform-input');
        const typeSelect = document.getElementById('transform-type');
        const rootNameInput = document.getElementById('transform-root-name');
        const optionalCheckbox = document.getElementById('transform-optional');
        const exportCheckbox = document.getElementById('transform-export');

        window.JSONToolbox?.saveToStorage('transform-input', input?.value || '');
        window.JSONToolbox?.saveToStorage('transform-type', typeSelect?.value || 'typescript');
        window.JSONToolbox?.saveToStorage('transform-root-name', rootNameInput?.value || 'RootObject');
        window.JSONToolbox?.saveToStorage('transform-optional', optionalCheckbox?.checked ?? true);
        window.JSONToolbox?.saveToStorage('transform-export', exportCheckbox?.checked ?? true);
    }

    function restoreState() {
        const input = document.getElementById('transform-input');
        const typeSelect = document.getElementById('transform-type');
        const rootNameInput = document.getElementById('transform-root-name');
        const optionalCheckbox = document.getElementById('transform-optional');
        const exportCheckbox = document.getElementById('transform-export');

        const savedInput = window.JSONToolbox?.loadFromStorage('transform-input');
        const savedType = window.JSONToolbox?.loadFromStorage('transform-type');
        const savedRootName = window.JSONToolbox?.loadFromStorage('transform-root-name');
        const savedOptional = window.JSONToolbox?.loadFromStorage('transform-optional');
        const savedExport = window.JSONToolbox?.loadFromStorage('transform-export');

        if (input && savedInput) input.value = window.JSONToolbox.ensureString(savedInput);
        if (typeSelect && savedType) typeSelect.value = savedType;
        if (rootNameInput && savedRootName) rootNameInput.value = savedRootName;
        if (optionalCheckbox && savedOptional !== null) optionalCheckbox.checked = savedOptional;
        if (exportCheckbox && savedExport !== null) exportCheckbox.checked = savedExport;
    }

    function addStyles() {
        if (document.getElementById('transform-module-styles')) return;

        const style = document.createElement('style');
        style.id = 'transform-module-styles';
        style.textContent = `
            .transform-module {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                height: 100%;
            }

            .transform-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                flex: 1;
                min-height: 300px;
            }

            .transform-input-section,
            .transform-output-section {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .transform-input-section textarea,
            .transform-output-section textarea {
                flex: 1;
                min-height: 250px;
                resize: vertical;
            }

            .transform-options {
                background: var(--bg-secondary);
                padding: 1rem;
                border-radius: var(--radius);
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .options-row {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                align-items: flex-end;
            }

            .option-group {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .option-group label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .options-checkboxes {
                display: flex;
                flex-direction: row;
                gap: 1rem;
                padding-bottom: 0.25rem;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
            }

            .form-select,
            .form-input {
                padding: 0.5rem;
                border: 1px solid var(--border);
                border-radius: var(--radius);
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 0.875rem;
            }

            .form-input {
                width: 150px;
            }

            @media (max-width: 768px) {
                .transform-grid {
                    grid-template-columns: 1fr;
                }

                .options-row {
                    flex-direction: column;
                    align-items: stretch;
                }

                .form-input {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Export for external access
    window.TransformModule = { init };

    // Initialize on tab change
    window.addEventListener('jsontoolbox:tabchange', (e) => {
        if (e.detail.tab === MODULE_NAME) {
            init();
        }
    });

    // Initialize if already on this tab
    if (document.querySelector('.json-toolbox__tab--active[data-tab="transform"]')) {
        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
    }
})();
