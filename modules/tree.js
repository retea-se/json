/**
 * JSON Toolbox - Tree View Module
 * Interactive tree visualization of JSON data
 */
(function() {
    'use strict';

    const MODULE_NAME = 'tree';
    let initialized = false;
    let expandedNodes = new Set();

    // Get translations
    function t(key) {
        return (window.i18n && window.i18n[key]) || key;
    }

    function init() {
        if (initialized) return;
        
        const container = document.getElementById('content-tree');
        if (!container) return;

        container.innerHTML = `
            <div class="tree-module">
                <div class="tree-toolbar">
                    <div class="toolbar-left">
                        <button type="button" class="btn btn-sm" id="tree-paste" title="${t('paste')}">
                            <i data-lucide="clipboard-paste"></i> ${t('paste')}
                        </button>
                        <button type="button" class="btn btn-sm" id="tree-sample" title="${t('load_sample')}">
                            <i data-lucide="file-code"></i> ${t('load_sample')}
                        </button>
                        <button type="button" class="btn btn-sm" id="tree-clear" title="${t('clear')}">
                            <i data-lucide="trash-2"></i> ${t('clear')}
                        </button>
                    </div>
                    <div class="toolbar-right">
                        <button type="button" class="btn btn-sm" id="tree-expand-all" title="${t('tree_expand_all')}">
                            <i data-lucide="plus-square"></i> ${t('tree_expand_all')}
                        </button>
                        <button type="button" class="btn btn-sm" id="tree-collapse-all" title="${t('tree_collapse_all')}">
                            <i data-lucide="minus-square"></i> ${t('tree_collapse_all')}
                        </button>
                        <div class="search-box">
                            <input type="text" id="tree-search" placeholder="${t('tree_search')}" class="form-input">
                            <i data-lucide="search" class="search-icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="tree-container">
                    <div class="tree-input-panel">
                        <label for="tree-input">${t('tree_input')}</label>
                        <textarea id="tree-input" class="code-input" placeholder='${t('tree_placeholder')}'></textarea>
                        <button type="button" class="btn btn-primary" id="tree-render">
                            <i data-lucide="folder-tree"></i> ${t('tree_render')}
                        </button>
                    </div>
                    
                    <div class="tree-view-panel">
                        <div class="tree-header">
                            <span>${t('tree_view')}</span>
                            <div class="tree-stats" id="tree-stats"></div>
                        </div>
                        <div id="tree-view" class="tree-view">
                            <div class="tree-empty">${t('tree_empty')}</div>
                        </div>
                    </div>
                </div>

                <div class="tree-path-bar" id="tree-path-bar">
                    <i data-lucide="map-pin"></i>
                    <span id="tree-path">${t('tree_path_hint')}</span>
                    <button type="button" class="btn btn-sm" id="tree-copy-path" title="${t('tree_copy_path')}" style="display:none;">
                        <i data-lucide="copy"></i>
                    </button>
                </div>
                
                <div id="tree-status" class="module-status"></div>
            </div>
        `;

        bindEvents();
        addStyles();
        window.JSONToolbox?.refreshIcons(container);
        restoreState();
        initialized = true;
    }

    function bindEvents() {
        const input = document.getElementById('tree-input');
        const renderBtn = document.getElementById('tree-render');
        const pasteBtn = document.getElementById('tree-paste');
        const sampleBtn = document.getElementById('tree-sample');
        const clearBtn = document.getElementById('tree-clear');
        const expandAllBtn = document.getElementById('tree-expand-all');
        const collapseAllBtn = document.getElementById('tree-collapse-all');
        const searchInput = document.getElementById('tree-search');
        const copyPathBtn = document.getElementById('tree-copy-path');

        renderBtn?.addEventListener('click', renderTree);
        pasteBtn?.addEventListener('click', pasteInput);
        sampleBtn?.addEventListener('click', loadSample);
        clearBtn?.addEventListener('click', clearAll);
        expandAllBtn?.addEventListener('click', expandAll);
        collapseAllBtn?.addEventListener('click', collapseAll);
        copyPathBtn?.addEventListener('click', copyCurrentPath);

        // Search
        searchInput?.addEventListener('input', debounce(handleSearch, 300));

        // Auto-render on input change with debounce
        input?.addEventListener('input', debounce(() => {
            saveState();
        }, 500));

        // Keyboard shortcut
        input?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                renderTree();
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
                    renderTree();
                };
                reader.readAsText(file);
            } else if (e.dataTransfer?.getData('text')) {
                input.value = e.dataTransfer.getData('text');
                saveState();
                renderTree();
            }
        });
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    function renderTree() {
        const input = document.getElementById('tree-input');
        const treeView = document.getElementById('tree-view');
        const stats = document.getElementById('tree-stats');

        if (!input?.value.trim()) {
            treeView.innerHTML = `<div class="tree-empty">${t('tree_empty')}</div>`;
            stats.textContent = '';
            return;
        }

        try {
            const json = JSON.parse(input.value);
            expandedNodes.clear();
            
            const nodeStats = countNodes(json);
            stats.textContent = `${nodeStats.objects} ${t('tree_objects')}, ${nodeStats.arrays} ${t('tree_arrays')}, ${nodeStats.primitives} ${t('tree_primitives')}`;
            
            treeView.innerHTML = '';
            const rootNode = createTreeNode('root', json, '$');
            treeView.appendChild(rootNode);
            
            // Expand first level by default
            const firstLevelToggles = treeView.querySelectorAll('.tree-node > .tree-node-content > .tree-toggle');
            firstLevelToggles.forEach(toggle => {
                const nodeId = toggle.closest('.tree-node')?.dataset.nodeId;
                if (nodeId) {
                    expandedNodes.add(nodeId);
                    toggle.closest('.tree-node')?.classList.add('expanded');
                }
            });

            // Analytics: track successful render
            if (window.JTA) {
                window.JTA.trackSuccess('tree', 'render', nodeStats.objects + nodeStats.arrays);
            }
            showStatus('success', t('tree_render_success'));
        } catch (e) {
            // Analytics: track error
            if (window.JTA) {
                window.JTA.trackError('tree', 'parse');
            }
            treeView.innerHTML = `<div class="tree-error"><i data-lucide="alert-triangle"></i> ${t('error_invalid_json')}: ${e.message}</div>`;
            stats.textContent = '';
        }
    }

    function countNodes(value) {
        let objects = 0, arrays = 0, primitives = 0;

        function count(val) {
            if (val === null) {
                primitives++;
            } else if (Array.isArray(val)) {
                arrays++;
                val.forEach(count);
            } else if (typeof val === 'object') {
                objects++;
                Object.values(val).forEach(count);
            } else {
                primitives++;
            }
        }

        count(value);
        return { objects, arrays, primitives };
    }

    function createTreeNode(key, value, path) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.dataset.nodeId = path;
        node.dataset.path = path;

        const content = document.createElement('div');
        content.className = 'tree-node-content';

        const isExpandable = value !== null && typeof value === 'object';
        const isArray = Array.isArray(value);

        if (isExpandable) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.innerHTML = '<i data-lucide="chevron-right"></i>';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNode(node);
            });
            content.appendChild(toggle);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'tree-spacer';
            content.appendChild(spacer);
        }

        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = key === 'root' ? '$' : key;
        content.appendChild(keySpan);

        if (isExpandable) {
            const typeSpan = document.createElement('span');
            typeSpan.className = 'tree-type';
            if (isArray) {
                typeSpan.innerHTML = `<i data-lucide="square-code"></i> Array[${value.length}]`;
            } else {
                typeSpan.innerHTML = `<i data-lucide="braces"></i> Object{${Object.keys(value).length}}`;
            }
            content.appendChild(typeSpan);
        } else {
            const valueSpan = document.createElement('span');
            valueSpan.className = `tree-value tree-value-${getValueType(value)}`;
            valueSpan.textContent = formatValue(value);
            content.appendChild(valueSpan);
        }

        content.addEventListener('click', () => {
            selectNode(node, path);
        });

        node.appendChild(content);

        if (isExpandable) {
            const children = document.createElement('div');
            children.className = 'tree-children';

            if (isArray) {
                value.forEach((item, index) => {
                    const childPath = `${path}[${index}]`;
                    children.appendChild(createTreeNode(index, item, childPath));
                });
            } else {
                Object.entries(value).forEach(([k, v]) => {
                    const childPath = `${path}.${k}`;
                    children.appendChild(createTreeNode(k, v, childPath));
                });
            }

            node.appendChild(children);
        }

        return node;
    }

    function getValueType(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'unknown';
    }

    function formatValue(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
    }

    function toggleNode(node) {
        const nodeId = node.dataset.nodeId;
        
        if (node.classList.contains('expanded')) {
            node.classList.remove('expanded');
            expandedNodes.delete(nodeId);
        } else {
            node.classList.add('expanded');
            expandedNodes.add(nodeId);
        }
    }

    function selectNode(node, path) {
        // Remove previous selection
        document.querySelectorAll('.tree-node.selected').forEach(n => {
            n.classList.remove('selected');
        });

        node.classList.add('selected');
        
        const pathSpan = document.getElementById('tree-path');
        const copyBtn = document.getElementById('tree-copy-path');
        
        if (pathSpan) {
            pathSpan.textContent = path;
            pathSpan.dataset.path = path;
        }
        
        if (copyBtn) {
            copyBtn.style.display = 'inline-flex';
        }
    }

    async function copyCurrentPath() {
        const pathSpan = document.getElementById('tree-path');
        const path = pathSpan?.dataset.path;
        
        if (!path) return;

        try {
            await navigator.clipboard.writeText(path);
            // Analytics: track copy path
            if (window.JTA) {
                window.JTA.trackCopy('tree-path');
            }
            showStatus('success', t('tree_path_copied'));
        } catch (e) {
            showStatus('error', t('error_copy_failed'));
        }
    }

    function expandAll() {
        document.querySelectorAll('.tree-node').forEach(node => {
            if (node.querySelector('.tree-toggle')) {
                node.classList.add('expanded');
                expandedNodes.add(node.dataset.nodeId);
            }
        });
    }

    function collapseAll() {
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('expanded');
        });
        expandedNodes.clear();
    }

    function handleSearch() {
        const searchInput = document.getElementById('tree-search');
        const query = searchInput?.value.toLowerCase().trim();
        
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('search-match', 'search-hidden');
        });

        if (!query) return;

        document.querySelectorAll('.tree-node').forEach(node => {
            const key = node.querySelector('.tree-key')?.textContent.toLowerCase() || '';
            const value = node.querySelector('.tree-value')?.textContent.toLowerCase() || '';
            
            if (key.includes(query) || value.includes(query)) {
                node.classList.add('search-match');
                // Expand parents
                let parent = node.parentElement?.closest('.tree-node');
                while (parent) {
                    parent.classList.add('expanded');
                    expandedNodes.add(parent.dataset.nodeId);
                    parent = parent.parentElement?.closest('.tree-node');
                }
            }
        });
    }

    async function pasteInput() {
        try {
            const text = await navigator.clipboard.readText();
            const input = document.getElementById('tree-input');
            if (input) {
                input.value = text;
                saveState();
                renderTree();
            }
        } catch (e) {
            showStatus('error', t('error_paste_failed'));
        }
    }

    function loadSample() {
        const sample = {
            "company": "Acme Corp",
            "founded": 1985,
            "active": true,
            "headquarters": {
                "city": "Stockholm",
                "country": "Sweden",
                "coordinates": {
                    "lat": 59.3293,
                    "lng": 18.0686
                }
            },
            "employees": [
                {
                    "name": "Alice",
                    "role": "CEO",
                    "skills": ["leadership", "strategy"]
                },
                {
                    "name": "Bob",
                    "role": "CTO",
                    "skills": ["engineering", "architecture"]
                }
            ],
            "products": ["Widget", "Gadget", "Gizmo"],
            "metadata": null
        };

        const input = document.getElementById('tree-input');
        if (input) {
            input.value = JSON.stringify(sample, null, 2);
            saveState();
            renderTree();
        }
    }

    function clearAll() {
        const input = document.getElementById('tree-input');
        const treeView = document.getElementById('tree-view');
        const stats = document.getElementById('tree-stats');
        const pathSpan = document.getElementById('tree-path');
        const copyBtn = document.getElementById('tree-copy-path');
        const searchInput = document.getElementById('tree-search');

        if (input) input.value = '';
        if (treeView) treeView.innerHTML = `<div class="tree-empty">${t('tree_empty')}</div>`;
        if (stats) stats.textContent = '';
        if (pathSpan) {
            pathSpan.textContent = t('tree_path_hint');
            delete pathSpan.dataset.path;
        }
        if (copyBtn) copyBtn.style.display = 'none';
        if (searchInput) searchInput.value = '';
        
        expandedNodes.clear();
        saveState();
        showStatus('info', t('cleared'));
    }

    function showStatus(type, message) {
        const status = document.getElementById('tree-status');
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
        const input = document.getElementById('tree-input');
        window.JSONToolbox?.saveToStorage('tree-input', input?.value || '');
    }

    function restoreState() {
        const input = document.getElementById('tree-input');
        const savedInput = window.JSONToolbox?.loadFromStorage('tree-input');
        if (input && savedInput) {
            input.value = window.JSONToolbox.ensureString(savedInput);
        }
    }

    function addStyles() {
        if (document.getElementById('tree-module-styles')) return;

        const style = document.createElement('style');
        style.id = 'tree-module-styles';
        style.textContent = `
            .tree-module {
                display: flex;
                flex-direction: column;
                gap: var(--space-lg);
                height: 100%;
            }

            .tree-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: var(--space-md);
            }

            .toolbar-left,
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: var(--space-md);
            }

            .search-box {
                position: relative;
            }

            .search-box input {
                padding-left: var(--space-2xl);
                width: 200px;
            }

            .search-icon {
                position: absolute;
                left: var(--space-lg);
                top: 50%;
                transform: translateY(-50%);
                color: var(--color-text-tertiary);
                width: 14px;
                height: 14px;
            }

            .tree-container {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: var(--space-xl);
                flex: 1;
                min-height: 300px;
            }

            .tree-input-panel {
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }

            .tree-input-panel label {
                font-size: var(--text-body-sm);
                font-weight: var(--weight-medium);
                color: var(--color-text-secondary);
            }

            .tree-input-panel textarea {
                flex: 1;
                min-height: 200px;
                resize: none;
                font-family: var(--font-mono);
                font-size: var(--text-body-sm);
            }

            .tree-view-panel {
                display: flex;
                flex-direction: column;
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }

            .tree-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-md) var(--space-xl);
                background: var(--color-surface-elevated);
                border-bottom: 1px solid var(--color-border);
                font-size: var(--text-body-sm);
                font-weight: var(--weight-semibold);
            }

            .tree-stats {
                font-size: var(--text-caption);
                font-weight: var(--weight-normal);
                color: var(--color-text-tertiary);
            }

            .tree-view {
                flex: 1;
                overflow: auto;
                padding: var(--space-xl);
                font-family: var(--font-mono);
                font-size: var(--text-body-sm);
                line-height: var(--leading-relaxed);
            }

            /* Custom scrollbar for tree view */
            .tree-view::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            .tree-view::-webkit-scrollbar-track {
                background: transparent;
            }

            .tree-view::-webkit-scrollbar-thumb {
                background: var(--color-border);
                border-radius: var(--radius-full);
            }

            .tree-view::-webkit-scrollbar-thumb:hover {
                background: var(--color-text-tertiary);
            }

            .tree-empty,
            .tree-error {
                color: var(--color-text-tertiary);
                text-align: center;
                padding: var(--space-3xl);
                font-family: var(--font-sans);
            }

            .tree-error {
                color: var(--color-error);
            }

            .tree-error i {
                margin-right: var(--space-sm);
            }

            .tree-node {
                margin-left: var(--space-xl);
            }

            .tree-node:first-child {
                margin-left: 0;
            }

            .tree-node-content {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: var(--space-xs) var(--space-sm);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background var(--transition-fast);
            }

            .tree-node-content:hover {
                background: var(--color-surface-elevated);
            }

            .tree-node.selected > .tree-node-content {
                background: var(--color-primary);
                color: white;
            }

            .tree-node.selected > .tree-node-content .tree-type,
            .tree-node.selected > .tree-node-content .tree-value,
            .tree-node.selected > .tree-node-content .tree-key {
                color: white;
            }

            .tree-node.search-match > .tree-node-content {
                background: rgba(234, 179, 8, 0.2);
                outline: 1px solid var(--color-warning);
            }

            .tree-toggle {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--color-text-tertiary);
                transition: transform var(--transition-fast), color var(--transition-fast);
                flex-shrink: 0;
            }

            .tree-toggle:hover {
                color: var(--color-text-secondary);
            }

            .tree-toggle i {
                width: 12px;
                height: 12px;
            }

            .tree-node.expanded > .tree-node-content > .tree-toggle {
                transform: rotate(90deg);
            }

            .tree-spacer {
                width: 16px;
                flex-shrink: 0;
            }

            .tree-key {
                color: var(--color-primary);
                font-weight: var(--weight-medium);
            }

            .tree-key::after {
                content: ':';
                color: var(--color-text-tertiary);
                margin-left: 1px;
            }

            .tree-type {
                color: var(--color-text-tertiary);
                font-size: var(--text-caption);
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }

            .tree-type i {
                width: 12px;
                height: 12px;
                opacity: 0.7;
            }

            .tree-value {
                color: var(--color-text);
            }

            .tree-value-string {
                color: var(--color-success);
            }

            .tree-value-number {
                color: var(--color-info);
            }

            .tree-value-boolean {
                color: var(--color-warning);
            }

            .tree-value-null {
                color: var(--color-text-tertiary);
                font-style: italic;
            }

            .tree-children {
                display: none;
                border-left: 1px solid var(--color-border);
                margin-left: 7px;
                padding-left: var(--space-md);
            }

            .tree-node.expanded > .tree-children {
                display: block;
            }

            .tree-path-bar {
                display: flex;
                align-items: center;
                gap: var(--space-md);
                padding: var(--space-md) var(--space-xl);
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                font-family: var(--font-mono);
                font-size: var(--text-body-sm);
                color: var(--color-text-secondary);
            }

            .tree-path-bar > i:first-child {
                color: var(--color-primary);
                width: 14px;
                height: 14px;
                flex-shrink: 0;
            }

            #tree-path {
                flex: 1;
                word-break: break-all;
            }

            @media (max-width: 768px) {
                .tree-container {
                    grid-template-columns: 1fr;
                }

                .toolbar-left,
                .toolbar-right {
                    flex-wrap: wrap;
                }

                .search-box input {
                    width: 150px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Export for external access
    window.TreeModule = { init, renderTree };

    // Initialize on tab change
    window.addEventListener('jsontoolbox:tabchange', (e) => {
        if (e.detail.tab === MODULE_NAME) {
            init();
        }
    });

    // Initialize if already on this tab
    if (document.querySelector('.json-toolbox__tab--active[data-tab="tree"]')) {
        document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
    }
})();
