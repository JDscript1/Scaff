# ScaffoldForge MCP Server 🛠️

ScaffoldForge este un server profesional bazat pe **Model Context Protocol (MCP)**, creat pentru a automatiza procesul de scaffolding și generare de cod repetitiv (React, Node.js, Fastify, Android). 

Este conceput special pentru a fi utilizat de agenți AI în IDE-uri precum **Cursor**, **Claude Code**, **Cline** sau **Continue**.

## 🚀 Caracteristici principale

- **Detectare Inteligentă:** Identifică automat stack-ul (React, Fastify, Android) chiar și în monorepo-uri.
- **Siguranță Maximă (Anti-Path Traversal):** Toate operațiunile sunt limitate strict la workspace-ul curent.
- **Protecție la Suprascriere:** Nu distruge codul existent fără un flag explicit de `overwrite`.
- **Motor de Template-uri Handlebars:** Codul generat este decuplat în fișiere `.hbs` ușor de extins.
- **Preview & Dry-Run:** Vizualizează planul de generare JSON înainte de a face orice schimbare pe disc.
- **Validare Zod:** Toate comenzile sunt validate strict pentru a preveni erori de execuție.

## 📦 Instalare Locală

1. **Cerințe:** Node.js 18+ și `npm` sau `pnpm`.
2. **Clonare și Build:**
   ```bash
   git clone <url-ul-tau-github>
   cd scaffold-forge-mcp
   npm install
   npm run build
   ```

## 🛠️ Configurare în IDE (Cursor/Claude/Cline)

Adaugă un nou server MCP în setările IDE-ului tău:

- **Name:** ScaffoldForge
- **Type:** `command`
- **Command:** `node /calea/catre/scaffold-forge-mcp/build/index.js`

## 🧩 Tool-uri Disponibile

| Tool | Descriere |
| :--- | :--- |
| `inspect_project_structure` | Analizează structura proiectului și detectează stack-ul. |
| `list_templates` | Listează toate șabloanele disponibile pentru generare. |
| `preview_generation_plan` | Arată ce fișiere ar urma să fie create/modificate (Safe). |
| `init_project` | Creează un proiect nou dintr-un template. |
| `generate_feature` | Adaugă un feature complet (UI, Logică, API). |
| `generate_backend_module` | Generează module backend (Routes, Service, Repository). |
| `add_project_capability` | Adaugă Docker, CI/CD, Linting sau Configs. |

## 🌐 Deployment (Railway / Render)

Dacă dorești să rulezi serverul MCP la distanță (via SSE - Server-Sent Events):
1. Acest server folosește momentan transportul **Stdio** (standard pentru uz local).
2. Pentru hosting pe Railway, se recomandă folosirea unui wrapper HTTP/SSE (vezi documentația MCP SDK pentru SSE transport).
3. Railway Start Command: `npm start`.

## 🛡️ Securitate

ScaffoldForge include un strat de protecție `safeResolve` care previne orice încercare de "escape" din directorul rădăcină. Toate căile sunt normalizate și validate.

## 🧪 Testare

```bash
npm test
```

## 📜 Licență
MIT
