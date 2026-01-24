/**
 * JSON Toolbox - Sample Data Module
 * Version: 1.1.0
 *
 * Provides sample datasets for all modules to help users get started quickly.
 * Includes real-world examples: financial data, logs, configs, schemas.
 */

(function() {
  'use strict';

  // ============================================
  // i18n Helper
  // ============================================
  const t = (key, fallback) => (window.i18n && window.i18n[key]) || fallback;

  // ============================================
  // Sample Datasets
  // ============================================
  const SAMPLES = {
    // CSV Samples
    csv: {
      financial: {
        name: () => t('sample_csv_financial', 'Financial Data'),
        description: () => t('sample_csv_financial_desc', 'Monthly sales report'),
        data: `Date,Product,Category,Units,Revenue,Region
2024-01-15,Widget Pro,Electronics,150,4500.00,North
2024-01-15,Gadget X,Electronics,89,2670.00,South
2024-01-16,Widget Pro,Electronics,203,6090.00,East
2024-01-16,Service Plan,Services,45,1350.00,West
2024-01-17,Gadget X,Electronics,167,5010.00,North
2024-01-17,Widget Basic,Electronics,312,3120.00,South
2024-01-18,Service Plan,Services,78,2340.00,East
2024-01-18,Widget Pro,Electronics,95,2850.00,West`
      },
      logs: {
        name: () => t('sample_csv_logs', 'Server Logs'),
        description: () => t('sample_csv_logs_desc', 'Apache-style access log'),
        data: `timestamp,method,path,status,response_time_ms,user_agent
2024-01-20T10:23:45Z,GET,/api/users,200,45,Mozilla/5.0
2024-01-20T10:23:46Z,POST,/api/orders,201,123,curl/7.68.0
2024-01-20T10:23:47Z,GET,/api/products,200,32,Chrome/120.0
2024-01-20T10:23:48Z,GET,/api/users/123,404,12,Firefox/121.0
2024-01-20T10:23:49Z,PUT,/api/orders/456,200,89,PostmanRuntime/7.35
2024-01-20T10:23:50Z,DELETE,/api/cache,204,5,internal-service
2024-01-20T10:23:51Z,GET,/health,200,2,kubernetes-probe`
      },
      users: {
        name: () => t('sample_csv_users', 'User Directory'),
        description: () => t('sample_csv_users_desc', 'Employee contact list'),
        data: `id,name,email,department,role,start_date
1,Alice Johnson,alice@example.com,Engineering,Senior Developer,2021-03-15
2,Bob Smith,bob@example.com,Marketing,Marketing Manager,2020-07-01
3,Carol Williams,carol@example.com,Engineering,Tech Lead,2019-11-20
4,David Brown,david@example.com,Sales,Sales Representative,2022-01-10
5,Eva Martinez,eva@example.com,Engineering,Junior Developer,2023-06-05`
      }
    },

    // JSON Samples
    json: {
      api_response: {
        name: () => t('sample_json_api', 'API Response'),
        description: () => t('sample_json_api_desc', 'REST API response'),
        data: {
          status: "success",
          data: {
            users: [
              { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
              { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
              { id: 3, name: "Carol", email: "carol@example.com", role: "user" }
            ],
            pagination: {
              page: 1,
              perPage: 10,
              total: 3,
              totalPages: 1
            }
          },
          meta: {
            requestId: "req_abc123",
            timestamp: "2024-01-20T10:30:00Z"
          }
        }
      },
      config: {
        name: () => t('sample_json_config', 'App Config'),
        description: () => t('sample_json_config_desc', 'Application settings'),
        data: {
          app: {
            name: "MyApp",
            version: "2.1.0",
            environment: "production"
          },
          server: {
            host: "0.0.0.0",
            port: 3000,
            ssl: true
          },
          database: {
            type: "postgresql",
            host: "db.example.com",
            port: 5432,
            name: "myapp_prod",
            pool: { min: 5, max: 20 }
          },
          features: {
            darkMode: true,
            analytics: true,
            betaFeatures: false
          }
        }
      },
      nested: {
        name: () => t('sample_json_nested', 'Nested Structure'),
        description: () => t('sample_json_nested_desc', 'Complex nested data'),
        data: {
          company: {
            name: "TechCorp",
            departments: [
              {
                name: "Engineering",
                teams: [
                  { name: "Frontend", members: 8, tech: ["React", "TypeScript"] },
                  { name: "Backend", members: 12, tech: ["Node.js", "Python", "Go"] },
                  { name: "DevOps", members: 4, tech: ["Kubernetes", "Terraform"] }
                ]
              },
              {
                name: "Product",
                teams: [
                  { name: "Design", members: 5, tools: ["Figma", "Sketch"] },
                  { name: "PM", members: 3, tools: ["Jira", "Confluence"] }
                ]
              }
            ]
          }
        }
      }
    },

    // YAML Samples
    yaml: {
      kubernetes: {
        name: () => t('sample_yaml_k8s', 'Kubernetes Deployment'),
        description: () => t('sample_yaml_k8s_desc', 'K8s deployment manifest'),
        data: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web
          image: myregistry/web-app:v2.1.0
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: "500m"
              memory: "256Mi"
            requests:
              cpu: "200m"
              memory: "128Mi"
          env:
            - name: NODE_ENV
              value: production
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: host`
      },
      github_actions: {
        name: () => t('sample_yaml_gha', 'GitHub Actions'),
        description: () => t('sample_yaml_gha_desc', 'CI/CD workflow'),
        data: `name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/`
      },
      docker_compose: {
        name: () => t('sample_yaml_docker', 'Docker Compose'),
        description: () => t('sample_yaml_docker_desc', 'Multi-service stack'),
        data: `version: "3.8"
services:
  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:`
      }
    },

    // XML Samples
    xml: {
      rss: {
        name: () => t('sample_xml_rss', 'RSS Feed'),
        description: () => t('sample_xml_rss_desc', 'Blog RSS feed'),
        data: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech Blog</title>
    <link>https://blog.example.com</link>
    <description>Latest in technology</description>
    <language>en-us</language>
    <item>
      <title>Getting Started with TypeScript</title>
      <link>https://blog.example.com/typescript-intro</link>
      <pubDate>Mon, 20 Jan 2024 10:00:00 GMT</pubDate>
      <description>Learn TypeScript basics</description>
      <category>Programming</category>
    </item>
    <item>
      <title>Docker Best Practices</title>
      <link>https://blog.example.com/docker-tips</link>
      <pubDate>Sun, 19 Jan 2024 14:30:00 GMT</pubDate>
      <description>Container optimization tips</description>
      <category>DevOps</category>
    </item>
  </channel>
</rss>`
      },
      svg: {
        name: () => t('sample_xml_svg', 'SVG Image'),
        description: () => t('sample_xml_svg_desc', 'Vector graphic'),
        data: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="180" height="180" rx="20" fill="url(#grad1)" />
  <text x="100" y="110" font-family="Arial" font-size="48" fill="white" text-anchor="middle">JT</text>
</svg>`
      },
      config: {
        name: () => t('sample_xml_config', 'XML Config'),
        description: () => t('sample_xml_config_desc', 'Application configuration'),
        data: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <appSettings>
    <add key="AppName" value="MyApplication" />
    <add key="Version" value="1.0.0" />
    <add key="Environment" value="Production" />
  </appSettings>
  <connectionStrings>
    <add name="DefaultConnection"
         connectionString="Server=db.example.com;Database=myapp;User=admin"
         providerName="System.Data.SqlClient" />
  </connectionStrings>
  <system.web>
    <compilation debug="false" targetFramework="4.8" />
    <httpRuntime maxRequestLength="10240" />
  </system.web>
</configuration>`
      }
    },

    // CSS Samples
    css: {
      modern: {
        name: () => t('sample_css_modern', 'Modern CSS'),
        description: () => t('sample_css_modern_desc', 'CSS variables & grid'),
        data: `:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --radius: 0.5rem;
}

.card {
  background: white;
  border-radius: var(--radius);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.button {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.button:hover {
  opacity: 0.9;
}`
      },
      animations: {
        name: () => t('sample_css_animations', 'CSS Animations'),
        description: () => t('sample_css_animations_desc', 'Keyframe animations'),
        data: `@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}`
      }
    },

    // JSON Schema Samples
    schema: {
      user: {
        name: () => t('sample_schema_user', 'User Schema'),
        description: () => t('sample_schema_user_desc', 'User data validation'),
        data: {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "$id": "https://example.com/user.schema.json",
          "title": "User",
          "description": "A user in the system",
          "type": "object",
          "required": ["id", "email", "name"],
          "properties": {
            "id": {
              "type": "integer",
              "description": "Unique identifier"
            },
            "email": {
              "type": "string",
              "format": "email",
              "description": "User email address"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            },
            "role": {
              "type": "string",
              "enum": ["admin", "user", "guest"],
              "default": "user"
            },
            "profile": {
              "type": "object",
              "properties": {
                "bio": { "type": "string", "maxLength": 500 },
                "avatar": { "type": "string", "format": "uri" }
              }
            }
          }
        }
      },
      api: {
        name: () => t('sample_schema_api', 'API Response Schema'),
        description: () => t('sample_schema_api_desc', 'REST API validation'),
        data: {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "title": "API Response",
          "type": "object",
          "required": ["status", "data"],
          "properties": {
            "status": {
              "type": "string",
              "enum": ["success", "error"]
            },
            "data": {
              "type": ["object", "array", "null"]
            },
            "error": {
              "type": "object",
              "properties": {
                "code": { "type": "string" },
                "message": { "type": "string" }
              }
            },
            "meta": {
              "type": "object",
              "properties": {
                "requestId": { "type": "string" },
                "timestamp": { "type": "string", "format": "date-time" }
              }
            }
          }
        }
      }
    },

    // Broken JSON for Fix module
    fix: {
      missing_quotes: {
        name: () => t('sample_fix_quotes', 'Missing Quotes'),
        description: () => t('sample_fix_quotes_desc', 'Unquoted keys/values'),
        data: `{
  name: "John Doe",
  age: 30,
  email: john@example.com,
  active: true
}`
      },
      trailing_commas: {
        name: () => t('sample_fix_commas', 'Trailing Commas'),
        description: () => t('sample_fix_commas_desc', 'Extra commas in JSON'),
        data: `{
  "users": [
    {"name": "Alice", "role": "admin",},
    {"name": "Bob", "role": "user",},
  ],
  "config": {
    "debug": true,
    "version": "1.0",
  },
}`
      },
      mixed_issues: {
        name: () => t('sample_fix_mixed', 'Multiple Issues'),
        description: () => t('sample_fix_mixed_desc', 'Various JSON errors'),
        data: `{
  name: 'Test App',
  version: 1.0,
  features: [
    {enabled: true, name: "Feature A",},
    {enabled: false name: "Feature B"}
  ]
  settings: {
    theme: dark,
    language: "en"
  }
}`
      }
    },

    // Diff module samples
    diff: {
      config_change: {
        name: () => t('sample_diff_config', 'Config Comparison'),
        description: () => t('sample_diff_config_desc', 'Before/after config'),
        left: {
          version: "1.0.0",
          debug: true,
          server: { host: "localhost", port: 3000 },
          features: { darkMode: false, analytics: false }
        },
        right: {
          version: "1.1.0",
          debug: false,
          server: { host: "0.0.0.0", port: 8080 },
          features: { darkMode: true, analytics: true, newFeature: true }
        }
      },
      api_response: {
        name: () => t('sample_diff_api', 'API Response Diff'),
        description: () => t('sample_diff_api_desc', 'API version changes'),
        left: {
          users: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" }
          ]
        },
        right: {
          users: [
            { id: 1, name: "Alice", email: "alice@example.com" },
            { id: 2, name: "Robert" },
            { id: 3, name: "Carol" }
          ]
        }
      }
    },

    // Query (JSONPath) samples
    query: {
      products: {
        name: () => t('sample_query_products', 'Product Catalog'),
        description: () => t('sample_query_products_desc', 'E-commerce data'),
        data: {
          store: {
            name: "TechStore",
            products: [
              { id: 1, name: "Laptop", price: 999, category: "Electronics", inStock: true },
              { id: 2, name: "Mouse", price: 29, category: "Accessories", inStock: true },
              { id: 3, name: "Monitor", price: 349, category: "Electronics", inStock: false },
              { id: 4, name: "Keyboard", price: 79, category: "Accessories", inStock: true },
              { id: 5, name: "Headphones", price: 149, category: "Electronics", inStock: true }
            ]
          }
        },
        queries: [
          { path: '$.store.products[*].name', desc: 'All product names' },
          { path: '$.store.products[?(@.price<100)]', desc: 'Products under $100' },
          { path: '$.store.products[?(@.inStock==true)].name', desc: 'In-stock product names' }
        ]
      }
    },

    // Transform samples
    transform: {
      typescript: {
        name: () => t('sample_transform_ts', 'TypeScript Interface'),
        description: () => t('sample_transform_ts_desc', 'Generate TS types'),
        data: {
          id: 123,
          username: "johndoe",
          email: "john@example.com",
          profile: {
            firstName: "John",
            lastName: "Doe",
            age: 30,
            verified: true
          },
          roles: ["user", "admin"],
          metadata: {
            createdAt: "2024-01-15T10:00:00Z",
            lastLogin: "2024-01-20T15:30:00Z"
          }
        }
      }
    },

    // Pipeline samples
    pipeline: {
      csv_to_filtered: {
        name: () => t('sample_pipeline_csv', 'CSV Filter Pipeline'),
        description: () => t('sample_pipeline_csv_desc', 'Parse, filter, format'),
        input: `name,age,city,active
Alice,30,Stockholm,true
Bob,25,Göteborg,false
Carol,35,Malmö,true
David,28,Uppsala,true`,
        steps: [
          { operator: 'csv.parse', params: { header: true } },
          { operator: 'transform.filter', params: { expression: 'item.active === "true"' } },
          { operator: 'json.stringify', params: { indent: 2 } }
        ]
      },
      json_transform: {
        name: () => t('sample_pipeline_json', 'JSON Transform'),
        description: () => t('sample_pipeline_json_desc', 'Parse, sort, stringify'),
        input: `[{"name":"Charlie","score":85},{"name":"Alice","score":92},{"name":"Bob","score":78}]`,
        steps: [
          { operator: 'json.parse' },
          { operator: 'transform.sort', params: { key: 'score', order: 'desc' } },
          { operator: 'json.stringify', params: { indent: 2 } }
        ]
      }
    }
  };

  // ============================================
  // Sample Data API
  // ============================================
  const SampleData = {
    /**
     * Get samples for a specific module
     * @param {string} module - Module name (csv, json, yaml, xml, etc.)
     * @returns {Object} Sample data object
     */
    getSamples(module) {
      return SAMPLES[module] || {};
    },

    /**
     * Get a specific sample
     * @param {string} module - Module name
     * @param {string} sampleId - Sample identifier
     * @returns {Object|null} Sample object
     */
    getSample(module, sampleId) {
      return SAMPLES[module]?.[sampleId] || null;
    },

    /**
     * Get sample data as string
     * @param {string} module - Module name
     * @param {string} sampleId - Sample identifier
     * @returns {string} Sample data as string
     */
    getSampleString(module, sampleId) {
      const sample = this.getSample(module, sampleId);
      if (!sample) return '';

      if (typeof sample.data === 'string') {
        return sample.data;
      }
      return JSON.stringify(sample.data, null, 2);
    },

    /**
     * Get list of available samples for a module
     * @param {string} module - Module name
     * @returns {Array} Array of {id, name, description}
     */
    listSamples(module) {
      const samples = SAMPLES[module];
      if (!samples) return [];

      return Object.entries(samples).map(([id, sample]) => ({
        id,
        name: typeof sample.name === 'function' ? sample.name() : sample.name,
        description: typeof sample.description === 'function' ? sample.description() : sample.description
      }));
    },

    /**
     * Create a sample selector dropdown
     * @param {string} module - Module name
     * @param {Function} onSelect - Callback when sample selected
     * @returns {HTMLElement} Dropdown element
     */
    createSampleSelector(module, onSelect) {
      const samples = this.listSamples(module);
      if (samples.length === 0) return null;

      const wrapper = document.createElement('div');
      wrapper.className = 'sample-selector';
      wrapper.innerHTML = `
        <button type="button" class="json-toolbox__btn json-toolbox__btn--ghost sample-selector__btn">
          <i data-lucide="file-text"></i>
          <span>${t('load_sample', 'Load sample')}</span>
          <i data-lucide="chevron-down" class="sample-selector__chevron"></i>
        </button>
        <div class="sample-selector__menu hidden">
          ${samples.map(s => `
            <button type="button" class="sample-selector__item" data-sample="${s.id}">
              <span class="sample-selector__item-name">${s.name}</span>
              <span class="sample-selector__item-desc">${s.description}</span>
            </button>
          `).join('')}
        </div>
      `;

      const btn = wrapper.querySelector('.sample-selector__btn');
      const menu = wrapper.querySelector('.sample-selector__menu');

      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
      });

      wrapper.querySelectorAll('.sample-selector__item').forEach(item => {
        item.addEventListener('click', () => {
          const sampleId = item.dataset.sample;
          const data = this.getSampleString(module, sampleId);
          menu.classList.add('hidden');
          if (onSelect) onSelect(data, sampleId);
        });
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });

      // Refresh icons
      if (window.lucide) {
        window.lucide.createIcons({ nodes: [wrapper] });
      }

      return wrapper;
    }
  };

  // ============================================
  // Add Sample Selector Styles
  // ============================================
  function addStyles() {
    if (document.getElementById('sample-data-styles')) return;

    const style = document.createElement('style');
    style.id = 'sample-data-styles';
    style.textContent = `
      .sample-selector {
        position: relative;
        display: inline-block;
      }

      .sample-selector__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
      }

      .sample-selector__chevron {
        width: 14px;
        height: 14px;
        transition: transform 0.2s;
      }

      .sample-selector__menu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.25rem;
        min-width: 220px;
        max-height: 300px;
        overflow-y: auto;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: var(--radius-md, 0.5rem);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 100;
      }

      [data-theme="dark"] .sample-selector__menu {
        background: var(--color-surface, #1e293b);
        border-color: var(--color-border, #334155);
      }

      .sample-selector__item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
      }

      .sample-selector__item:hover {
        background: var(--color-bg-hover, #f1f5f9);
      }

      [data-theme="dark"] .sample-selector__item:hover {
        background: var(--color-bg-hover, #334155);
      }

      .sample-selector__item-name {
        font-weight: 500;
        color: var(--color-text, #1e293b);
        font-size: 0.875rem;
      }

      [data-theme="dark"] .sample-selector__item-name {
        color: var(--color-text, #f1f5f9);
      }

      .sample-selector__item-desc {
        font-size: 0.75rem;
        color: var(--color-text-muted, #64748b);
        margin-top: 0.125rem;
      }

      .sample-selector__menu.hidden {
        display: none;
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize styles
  addStyles();

  // Export globally
  window.JSONToolboxSamples = SampleData;

})();
