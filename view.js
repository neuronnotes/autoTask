/**
 * autoTask v3 — Checklist hierárquica e reativa para Obsidian DataviewJS
 *
 * Arquitetura em 3 Camadas:
 *   1. Model & Tree Engine  — dados puros, árvore em memória, agregação bottom-up
 *   2. View & Presentation  — DOM cirúrgico, zero reflow desnecessário
 *   3. Storage & Persistence — IO atômico e condicional em disco
 *
 * Fluxo de decisão:
 *   buildTree() (só memória, zero I/O) → Fast Path? → sim: leitura seletiva + patch cirúrgico
 *                                                  → não: Full Render completo
 */

const current = dv.current();
const containerEl = dv.container || null;

// VIEW_KEY por instância de container, não por path.
// Isso permite que a mesma nota aberta em duas abas tenha views independentes.
const VIEW_KEY = (() => {
    if (!containerEl) return current?.file?.path || "";
    if (!containerEl.__autoTaskId) {
        containerEl.__autoTaskId =
            (current?.file?.path || "") + "|" + Math.random().toString(36).slice(2);
    }
    return containerEl.__autoTaskId;
})();

if (!window.__autoTaskActiveViews) window.__autoTaskActiveViews = new Map();
if (!window.__autoTaskLastAction)  window.__autoTaskLastAction  = {};

// Coleta de lixo: purga views órfãs de abas fechadas (evita vazamento e acúmulo de RAM)
for (const [key, view] of window.__autoTaskActiveViews.entries()) {
    if (key !== VIEW_KEY && view?.wrapper && view.wrapper.isConnected === false) {
        window.__autoTaskActiveViews.delete(key);
    }
}

const lastUserAction  = window.__autoTaskLastAction[VIEW_KEY] || 0;
const isSelfTriggered = (Date.now() - lastUserAction) < 2500;
let cachedView        = containerEl?.__autoTaskView || window.__autoTaskActiveViews.get(VIEW_KEY);

// Mantém o wrapper existente visível imediatamente para evitar flash branco
if (containerEl && cachedView?.wrapper && !cachedView.wrapper.isConnected) {
    if (typeof containerEl.appendChild === "function") {
        containerEl.appendChild(cachedView.wrapper);
    } else if (Array.isArray(containerEl.children)) {
        containerEl.children.push(cachedView.wrapper);
    }
}

// Se o refresh foi autoinfligido pelo nosso próprio processFrontMatter, aborta
if (containerEl && isSelfTriggered && cachedView?.wrapper) return;

// ══════════════════════════════════════════════════════════════════════
// 0. HELPERS E FORMATAÇÃO (Puros, sem efeitos colaterais)
// ══════════════════════════════════════════════════════════════════════

function isEnabled(v) {
    return v === true || (typeof v === "string" && v.toLowerCase() === "true");
}

function toArray(val) {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    if (typeof val.array === "function") return val.array();
    if (typeof val !== "string" && typeof val[Symbol.iterator] === "function")
        return Array.from(val);
    return [val];
}

function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(v) {
    if (!v) return "";
    if (typeof v.toFormat === "function") return v.toFormat("yyyy-MM-dd");
    return String(v).slice(0, 10);
}

function fmtTime(min) {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ══════════════════════════════════════════════════════════════════════
// 1. CONFIGURAÇÃO E TEMPLATES
// ══════════════════════════════════════════════════════════════════════

const FALLBACK_DEFAULTS = {
    sortBy: "manual", sortDir: "asc",
    noTime: false, barras: false, recursivo: false,
    barraTotal: null, barraFilhas: null,
};

function loadTemplates() {
    const templates = {};
    const pages = toArray(dv.pages().where(p => {
        const path = (p.file?.path || "").toLowerCase();
        return (path.includes("autotask/templates/") || path.includes("/templates/") || path.startsWith("templates/")) &&
               (path.endsWith(".md") || !path.includes("."));
    }));
    for (const p of pages) {
        const name = (p.file?.name || "").toLowerCase().replace(/\.md$/, "");
        if (!name) continue;
        const t = {};
        const fm = p.file?.frontmatter;
        if (fm && typeof fm === "object") Object.assign(t, fm);
        for (const k of ["recursivo","barraTotal","barraFilhas","sortBy","sortDir","noTime","barras"]) {
            if (p[k] !== undefined && p[k] !== null && t[k] === undefined) t[k] = p[k];
        }
        templates[name] = t;
    }
    const globals = (typeof window !== "undefined" && window.__AutoTaskTemplates) || {};
    for (const [k, v] of Object.entries(globals)) {
        templates[k.toLowerCase()] = Object.assign(templates[k.toLowerCase()] || {}, v);
    }
    return templates;
}

function resolveConfig(inputObj) {
    const inp = inputObj && typeof inputObj === "object" ? inputObj : {};
    const templates = loadTemplates();
    const defaultTpl = templates["default"] || {};
    let chosenTpl = {};
    if (inp.template && typeof inp.template === "object") {
        chosenTpl = inp.template;
    } else if (typeof inp.template === "string" && inp.template.trim()) {
        chosenTpl = templates[inp.template.trim().toLowerCase()] || {};
    }
    return Object.assign({}, FALLBACK_DEFAULTS, defaultTpl, chosenTpl, inp);
}

const cfg          = resolveConfig(input || {});
const SORT_BY      = cfg.sortBy  || "manual";
const SORT_DIR     = cfg.sortDir || "asc";
const SHOW_TIME    = !isEnabled(cfg.noTime);
const SHOW_TIME_BARS = isEnabled(cfg.barras);
const RECURSIVO    = isEnabled(cfg.recursivo);

function parseBarConfig(val) {
    if (!val) return { label: null, term: null };
    if (typeof val === "string")
        return val.trim() ? { label: val.trim(), term: null } : { label: null, term: null };
    const arr = toArray(val);
    const label = arr[0] != null && String(arr[0]).trim() ? String(arr[0]).trim() : null;
    const term  = arr[1] != null && String(arr[1]).trim() ? String(arr[1]).trim() : null;
    return { label, term };
}

const BARRA_TOTAL  = parseBarConfig(cfg.barraTotal);
const BARRA_FILHAS = parseBarConfig(cfg.barraFilhas);

// Cache de expansão persistido entre renders (por path de nota, não por container)
let expandedSet = null;
if (RECURSIVO) {
    if (!window.__TheBoxExpandedByFile) window.__TheBoxExpandedByFile = new Map();
    if (!window.__TheBoxExpandedByFile.has(current.file.path))
        window.__TheBoxExpandedByFile.set(current.file.path, new Set());
    expandedSet = window.__TheBoxExpandedByFile.get(current.file.path);
}

// ══════════════════════════════════════════════════════════════════════
// 2. CAMADA 1: MODEL & TREE ENGINE
// ══════════════════════════════════════════════════════════════════════

// ── Tempo: cache global persistido entre execuções ──
const TIME_RE = /```simple-time-tracker([\s\S]*?)```/g;

function sumEntries(entries) {
    let s = 0;
    for (const e of entries) {
        if (e.startTime && e.endTime)
            s += (new Date(e.endTime) - new Date(e.startTime)) / 1000;
        if (Array.isArray(e.subEntries)) s += sumEntries(e.subEntries);
    }
    return s;
}

async function readTimeFile(filePath) {
    const f = app.vault.getAbstractFileByPath(filePath);
    if (!f) return 0;
    const text = await app.vault.read(f);
    let total = 0;
    for (const m of text.matchAll(TIME_RE)) {
        try { total += sumEntries(JSON.parse(m[1].trim()).entries); } catch {}
    }
    return total / 60;
}

if (!window.__TheBoxTimeCache) window.__TheBoxTimeCache = new Map();

// Hook de invalidação — registrado uma vez, com referência para cleanup futuro
if (typeof app !== "undefined" && app.vault) {
    if (!window.__autoTaskVaultHookInstalledV4) {
        if (app.vault._events) {
            for (const evt of ["modify", "rename", "delete", "create"]) {
                const list = app.vault._events[evt];
                if (Array.isArray(list)) {
                    app.vault._events[evt] = list.filter(fn => {
                        const s = String(fn || "");
                        return !s.includes("__autoTask") && !s.includes("TheBox");
                    });
                }
            }
        }
        if (window.__autoTaskVaultHook && app.vault.off) {
            try { app.vault.off("modify", window.__autoTaskVaultHook); } catch {}
        }

        const onModify = (file) => {
            if (!file?.path) return;
            window.__TheBoxTimeCache?.delete(file.path);
            if (window.__autoTaskTheBoxIdx) {
                const fm = (typeof app !== "undefined" && app.metadataCache)
                    ? app.metadataCache.getFileCache(file)?.frontmatter
                    : null;
                if (fm?.theBox || window.__autoTaskTheBoxIdx.has(file.path) || window.__autoTaskTheBoxIdx.has(file.name)) {
                    window.__autoTaskTheBoxIdx = null;
                }
            }
        };

        const onRenameOrDelete = (file, oldPath) => {
            if (file?.path) window.__TheBoxTimeCache?.delete(file.path);
            if (oldPath)    window.__TheBoxTimeCache?.delete(oldPath);
            window.__autoTaskTheBoxIdx = null;
        };

        if (app.vault.on) {
            app.vault.on("modify", onModify);
            app.vault.on("rename", onRenameOrDelete);
            app.vault.on("delete", onRenameOrDelete);
        }

        window.__autoTaskVaultHook = onModify;
        window.__autoTaskVaultHookInstalledV4 = true;
    }
}

async function getTimeCached(filePath) {
    const f = app.vault.getAbstractFileByPath(filePath);
    if (!f) return 0;
    const mtime = f.stat?.mtime ?? f.mtime ?? null;
    const c = window.__TheBoxTimeCache.get(filePath);
    if (c && mtime !== null && c.mtime === mtime) return c.minutos;
    const minutos = await readTimeFile(filePath);
    window.__TheBoxTimeCache.set(filePath, { minutos, mtime });
    return minutos;
}

// Agrega tempos bottom-up; getTimeCached só relê arquivos com mtime diferente
async function computeTreeTimes(node) {
    if (!node) return 0;
    if (node.isBox) {
        const ownP = (node.isGhost || !node.page?.file)
            ? Promise.resolve(0)
            : getTimeCached(node.page.file.path);
        await Promise.all([
            ownP.then(v => { node.ownMinutes = v; }),
            Promise.all(node.children.map(c => computeTreeTimes(c)))
        ]);
        node.childrenMinutes = node.children.reduce((a, c) => a + (c.totalMinutes || 0), 0);
        node.totalMinutes = node.ownMinutes + node.childrenMinutes;
        return node.totalMinutes;
    } else {
        const min = (node.isGhost || !node.page?.file)
            ? 0 : await getTimeCached(node.page.file.path);
        node.ownMinutes = min;
        node.childrenMinutes = 0;
        node.totalMinutes = min;
        return min;
    }
}

// ── Índice theBox: cache global, sobrevive entre execuções ──
function getTheBoxIndex() {
    if (window.__autoTaskTheBoxIdx) return window.__autoTaskTheBoxIdx;
    const idx = new Map();
    for (const p of toArray(dv.pages().where(q => q.theBox))) {
        for (const b of toArray(p.theBox)) {
            if (!b) continue;
            const linkPath = typeof b === "string"
                ? b.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim()
                : (b.path || null);
            if (!linkPath) continue;
            const keys = new Set([linkPath, linkPath.split("/").pop().replace(/\.md$/, "")]);
            let target = null;
            if (typeof app !== "undefined" && app.metadataCache && p.file?.path)
                target = app.metadataCache.getFirstLinkpathDest(linkPath, p.file.path);
            if (!target && typeof dv.page === "function") {
                const pg = dv.page(linkPath);
                if (pg?.file) target = pg.file;
            }
            if (target) {
                if (target.path)     keys.add(target.path);
                if (target.name)     keys.add(target.name);
                if (target.basename) keys.add(target.basename);
            }
            for (const key of keys) {
                let list = idx.get(key);
                if (!list) { list = []; idx.set(key, list); }
                if (!list.some(e => e.page.file.path === p.file.path))
                    list.push({ page: p, displayName: null });
            }
        }
    }
    window.__autoTaskTheBoxIdx = idx;
    return idx;
}

function resolveChildren(boxPage) {
    const orderArr = toArray(boxPage.order);
    if (orderArr.length > 0) {
        return orderArr.map(link => {
            if (!link) return null;
            const linkPath = typeof link === "string"
                ? link.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim()
                : (link.path || null);
            if (!linkPath) return null;
            const display = typeof link === "string" && link.includes("|")
                ? link.split("|")[1].replace(/\]\]$/, "").trim()
                : (link.display || null);
            const p = dv.page(linkPath);
            if (p) return { page: p, displayName: display };
            const exists = app.metadataCache.getFirstLinkpathDest(linkPath, boxPage.file.path);
            if (exists) return null;
            const name = linkPath.split("/").pop().replace(/\.md$/, "");
            return {
                page: { file: { path: linkPath, name }, completed: false, done: null, ghost: true },
                displayName: display
            };
        }).filter(Boolean);
    }
    const idx = getTheBoxIndex();
    return idx.get(boxPage.file.path) || idx.get(boxPage.file.name) || [];
}

// ── Construção da Árvore (apenas memória, zero I/O) ──
function buildLeaf(entry) {
    const p = entry.page;
    const completed = p.completed === true;
    return {
        page: p, displayName: entry.displayName,
        isBox: false, isGhost: p.ghost === true,
        children: [], hasOrder: false,
        totalLeaves: 1, doneLeaves: completed ? 1 : 0,
        completed, doneDate: completed ? (fmtDate(p.done) || null) : null,
        parent: null, ui: null,
        ownMinutes: 0, childrenMinutes: 0, totalMinutes: 0
    };
}

function buildSubtree(entry, visited) {
    const p = entry.page;
    if (p.ghost === true) return buildLeaf(entry);
    const subEntries = resolveChildren(p);
    const children = [];
    for (const se of subEntries) {
        const sp = se.page.file.path;
        if (visited.has(sp)) continue;
        visited.add(sp);
        children.push(buildSubtree(se, visited));
    }
    if (children.length === 0) return buildLeaf(entry);
    let totalLeaves = 0, doneLeaves = 0, maxDate = "";
    for (const c of children) {
        totalLeaves += c.totalLeaves;
        doneLeaves  += c.doneLeaves;
        const d = c.doneDate || "";
        if (d > maxDate) maxDate = d;
    }
    const allDone = totalLeaves > 0 && doneLeaves === totalLeaves;
    const hasOrder = toArray(p.order).length > 0;
    const sortedChildren = sortNodes(children, hasOrder);
    const node = {
        page: p, displayName: entry.displayName,
        isBox: true, isGhost: false,
        children: sortedChildren, hasOrder,
        totalLeaves, doneLeaves,
        completed: allDone, doneDate: allDone && maxDate ? maxDate : null,
        parent: null, ui: null,
        ownMinutes: 0, childrenMinutes: 0, totalMinutes: 0
    };
    for (const c of sortedChildren) c.parent = node;
    return node;
}

function buildTree() {
    const visited = new Set([current.file.path]);
    const entries = resolveChildren(current);
    const children = [];
    for (const e of entries) {
        const cp = e.page.file.path;
        if (visited.has(cp)) continue;
        visited.add(cp);
        children.push(RECURSIVO ? buildSubtree(e, visited) : buildLeaf(e));
    }
    let totalLeaves = 0, doneLeaves = 0;
    for (const c of children) { totalLeaves += c.totalLeaves; doneLeaves += c.doneLeaves; }
    const hasOrder = toArray(current.order).length > 0;
    const sortedChildren = sortNodes(children, hasOrder);
    const root = {
        page: current, isBox: true, isGhost: false,
        children: sortedChildren, hasOrder,
        totalLeaves, doneLeaves,
        completed: totalLeaves > 0 && doneLeaves === totalLeaves,
        parent: null, ui: null,
        ownMinutes: 0, childrenMinutes: 0, totalMinutes: 0
    };
    for (const c of sortedChildren) c.parent = root;
    return root;
}

// Recalcula contadores de um nó box a partir dos filhos (puro, sem I/O)
function recomputeNode(node) {
    if (!node.isBox) return;
    let total = 0, done = 0, maxD = "";
    for (const c of node.children) {
        total += c.totalLeaves; done += c.doneLeaves;
        const d = c.doneDate || ""; if (d > maxD) maxD = d;
    }
    node.totalLeaves = total;
    node.doneLeaves  = done;
    node.completed   = total > 0 && done === total;
    node.doneDate    = node.completed && maxD ? maxD : null;
}

function sortNodes(nodes, hasOrder) {
    if (hasOrder && SORT_BY === "manual") {
        return SORT_DIR === "desc" ? [...nodes].reverse() : nodes;
    }
    const by = SORT_BY === "manual" ? "name" : SORT_BY;

    // Preserva o índice original para desempate estável em listas com order manual
    const originalIndex = new Map(nodes.map((n, i) => [n, i]));

    return [...nodes].sort((a, b) => {
        if (by === "completed") {
            const ca = a.completed ? 1 : 0;
            const cb = b.completed ? 1 : 0;
            if (ca !== cb) {
                return SORT_DIR === "desc" ? (cb - ca) : (ca - cb);
            }
            // Critério de desempate secundário estável entre tarefas com o mesmo status:
            if (hasOrder) {
                const idxA = originalIndex.get(a) ?? 0;
                const idxB = originalIndex.get(b) ?? 0;
                return idxA - idxB;
            }
            const nameA = a.displayName || a.page.file.name;
            const nameB = b.displayName || b.page.file.name;
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
        }

        if (by === "done") {
            const da = a.isBox ? (a.doneDate || "") : (a.page.done ? fmtDate(a.page.done) : "");
            const db = b.isBox ? (b.doneDate || "") : (b.page.done ? fmtDate(b.page.done) : "");
            if (da !== db) {
                return SORT_DIR === "desc" ? db.localeCompare(da) : da.localeCompare(db);
            }
            if (hasOrder) {
                return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);
            }
            const nameA = a.displayName || a.page.file.name;
            const nameB = b.displayName || b.page.file.name;
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
        }

        // Padrão: ordenação alfabética natural
        const nameA = a.displayName || a.page.file.name;
        const nameB = b.displayName || b.page.file.name;
        const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
        return SORT_DIR === "desc" ? -cmp : cmp;
    });
}

// ══════════════════════════════════════════════════════════════════════
// 3. CAMADA 3: STORAGE & PERSISTENCE (IO atômico e condicional)
// ══════════════════════════════════════════════════════════════════════

async function saveNodeStatus(node) {
    if (!node || node.isGhost || !node.page?.file?.path) return;
    const file = app.vault.getAbstractFileByPath(node.page.file.path);
    if (!file) return;

    const allDone = node.isBox
        ? (node.totalLeaves > 0 && node.doneLeaves === node.totalLeaves)
        : (node.completed === true);

    const curCompleted = node.page.completed === true;
    const curDone = node.page.done ? fmtDate(node.page.done) : null;
    const shouldDone = allDone ? (node.doneDate || today()) : null;

    const completedChanged =
        allDone !== curCompleted ||
        (allDone && shouldDone !== curDone) ||
        (!allDone && curDone !== null);

    if (!completedChanged) return;

    await app.fileManager.processFrontMatter(file, fm => {
        fm.completed = allDone;
        fm.done = shouldDone;
    });

    node.page.completed = allDone;
    node.page.done = shouldDone;
}

// Sincroniza boxes intermediárias em paralelo (IO atômico e condicional)
async function syncIntermediateBoxes(node) {
    if (!node?.isBox) return;
    const promises = [];
    function collect(n) {
        for (const c of n.children) {
            if (c.isBox && !c.isGhost) { promises.push(saveNodeStatus(c)); collect(c); }
        }
    }
    collect(node);
    if (promises.length > 0) await Promise.all(promises);
}

// ══════════════════════════════════════════════════════════════════════
// 4. DECISÃO: buildTree (zero I/O) → Fast Path vs Full Render
// ══════════════════════════════════════════════════════════════════════

const root = buildTree();
const entries = root.children;
const hasBoxChild = RECURSIVO && entries.some(n => n.isBox);
const currentEntryPaths = entries.map(e => `${e.page?.file?.path || ""}:${e.displayName || e.page?.file?.name || ""}`).join("|");

// ── FAST PATH: reconciliação in-place cirúrgica (sem recriar DOM nem piscar) ──
const canFastPath = Boolean(
    containerEl &&
    cachedView?.wrapper &&
    (cachedView.wrapper.isConnected == null || cachedView.wrapper.isConnected) &&
    cachedView.root &&
    typeof cachedView.updateNodeUI === "function" &&
    typeof cachedView.updateMainBar === "function" &&
    (cachedView.entryPaths === currentEntryPaths || (cachedView.root.children && cachedView.root.children.length === entries.length))
);

if (canFastPath) {
    // Leitura seletiva de tempos: só relê arquivos com mtime diferente do cache
    if (SHOW_TIME) await computeTreeTimes(root);

    function reconcile(cachedNode, freshNode, listEl) {
        const cachedChildren = cachedNode.children || [];
        const freshChildren  = freshNode.children  || [];

        const unmatchedCached = new Set(cachedChildren);
        const pairs = [];

        // 1. Pareia por path exato
        for (const fresh of freshChildren) {
            const fPath = fresh.page?.file?.path;
            const match = cachedChildren.find(c => unmatchedCached.has(c) && c.page?.file?.path === fPath);
            if (match) {
                unmatchedCached.delete(match);
                pairs.push({ cached: match, fresh });
            }
        }

        // 2. Pareia nós restantes (ex: renomeação de arquivo ou fallback por índice)
        const remainingFresh = freshChildren.filter(f => !pairs.some(p => p.fresh === f));
        const remainingCached = Array.from(unmatchedCached);
        for (let i = 0; i < remainingFresh.length && i < remainingCached.length; i++) {
            pairs.push({ cached: remainingCached[i], fresh: remainingFresh[i] });
        }

        // 3. Atualiza dados e UI de cada par
        for (const { cached, fresh } of pairs) {
            cached.page            = fresh.page;
            cached.displayName     = fresh.displayName;
            cached.completed       = fresh.completed;
            cached.doneLeaves      = fresh.doneLeaves;
            cached.totalLeaves     = fresh.totalLeaves;
            cached.doneDate        = fresh.doneDate;
            cached.totalMinutes    = fresh.totalMinutes;
            cached.ownMinutes      = fresh.ownMinutes;
            cached.childrenMinutes = fresh.childrenMinutes;

            if (cached.isBox && fresh.isBox) {
                reconcile(cached, fresh, cached.ui?.subContainer);
            }

            if (cached.ui && cachedView.updateNodeUI) {
                cachedView.updateNodeUI(cached);
            }
        }

        // 4. Garante ordenação visual no DOM sem recriar elementos (só reordena se a ordem mudou)
        if (listEl && typeof listEl.appendChild === "function" && listEl.children) {
            const expectedElements = [];
            for (const fresh of freshChildren) {
                const pair = pairs.find(p => p.fresh === fresh);
                if (pair?.cached?.ui?.row) {
                    expectedElements.push(pair.cached.ui.row);
                    if (pair.cached.ui.subContainer) {
                        expectedElements.push(pair.cached.ui.subContainer);
                    }
                }
            }

            const currentElements = Array.from(listEl.children);
            let orderDiffers = expectedElements.length !== currentElements.length;
            if (!orderDiffers) {
                for (let i = 0; i < expectedElements.length; i++) {
                    if (expectedElements[i] !== currentElements[i]) {
                        orderDiffers = true;
                        break;
                    }
                }
            }

            if (orderDiffers) {
                for (const el of expectedElements) {
                    listEl.appendChild(el);
                }
            }
        }
    }

    reconcile(cachedView.root, root, cachedView.listContainer);
    cachedView.root.completed       = root.completed;
    cachedView.root.doneLeaves      = root.doneLeaves;
    cachedView.root.totalLeaves     = root.totalLeaves;
    cachedView.root.doneDate        = root.doneDate;
    cachedView.root.page            = root.page;
    cachedView.root.totalMinutes    = root.totalMinutes;
    cachedView.root.ownMinutes      = root.ownMinutes;
    cachedView.root.childrenMinutes = root.childrenMinutes;
    cachedView.entryPaths           = currentEntryPaths;
    cachedView.updateMainBar(root.totalMinutes);

    if (cachedView.directTimeEl && root.ownMinutes > 0) {
        cachedView.directTimeEl.setText(
            `📖 Registrado diretamente nesta nota — 🕒 ${fmtTime(root.ownMinutes)}`
        );
    }

    await saveNodeStatus(cachedView.root);
    await syncIntermediateBoxes(cachedView.root);
    return;
}

// ── FULL RENDER: estrutura nova ou primeiro render ──
if (SHOW_TIME) await computeTreeTimes(root);
const ownMinutos   = root.ownMinutes   || 0;
const totalMinutos = root.totalMinutes || 0;

const masterWrapper = (containerEl
    ? containerEl.createEl("div", { attr: { class: "autotask-wrapper" } })
    : dv.el("div", "", { attr: { class: "autotask-wrapper" } }));

// Esconde o novo wrapper enquanto o antigo ainda está visível (evita flash)
if (cachedView?.wrapper && cachedView.wrapper !== masterWrapper) {
    masterWrapper.style.display = "none";
}

// ── Primitivas de Barra ──
function createBar(parent, isSubBar, opts = {}) {
    const margin  = opts.margin      || (isSubBar ? "6px 0 8px 0" : "8px 0");
    const height  = opts.height      || (isSubBar ? "8px" : "10px");
    const radius  = opts.radius      || (isSubBar ? "4px" : "6px");
    const bg      = opts.bg          || (isSubBar
        ? "var(--background-modifier-border, #333)" : "#333");
    const lStyle  = opts.labelStyle  || (isSubBar
        ? "font-size: 0.8em; margin-bottom: 3px; opacity: 0.8;"
        : "font-size: 0.85em; margin-bottom: 4px; opacity: 0.8;");
    const target  = parent || masterWrapper;
    const wrapper = target.createEl("div", { attr: { style: `margin: ${margin};` } });
    const label   = wrapper.createEl("div", { attr: { style: lStyle } });
    const barBg   = wrapper.createEl("div", {
        attr: { style: `background: ${bg}; border-radius: ${radius}; height: ${height}; overflow: hidden;` }
    });
    const fill = barBg.createEl("div", {
        attr: { style: "height: 100%; transition: width 0.3s ease;" }
    });
    return { label, fill };
}

function setBarVisual(fill, pct, colors) {
    fill.style.width = `${pct}%`;
    fill.style.background = pct === 100
        ? (colors ? colors.done : "#4caf50")
        : (colors ? colors.inProgress : "#5b8def");
}

function subBarText(node) {
    const d = node.doneLeaves, t = node.totalLeaves;
    const pct = t > 0 ? Math.round(d / t * 100) : 0;
    let txt = `${d} / ${t} concluidas (${pct}%)`;
    if (node.children.some(c => c.isBox)) {
        const dd = node.children.filter(c => c.completed).length;
        const dt = node.children.length;
        const dp = dt > 0 ? Math.round(dd / dt * 100) : 0;
        txt += `  ·  ${dd} / ${dt} filhas diretas (${dp}%)`;
    }
    return { txt, pct };
}

// ── Barra Principal ──
const topMargin = hasBoxChild ? "8px 0 6px 0" : "8px 0";
const { label: mainLabel, fill: mainFill } = createBar(null, false, { margin: topMargin });

let directLabel = null, directFill = null;
const DIRECT_COLORS = { inProgress: "#8b5cf6", done: "#10b981" };
if (hasBoxChild) {
    const bar = createBar(null, false, {
        margin: "4px 0 10px 0", height: "6px", radius: "4px",
        labelStyle: "font-size: 0.8em; margin-bottom: 3px; opacity: 0.75;"
    });
    directLabel = bar.label;
    directFill  = bar.fill;
}

function updateMainBar(overrideTotalMin) {
    const d = root.doneLeaves, t = root.totalLeaves;
    const pct = t > 0 ? Math.round(d / t * 100) : 0;
    const mins = overrideTotalMin != null ? overrideTotalMin : totalMinutos;

    let prefixo = "";
    if (BARRA_TOTAL.label)   prefixo = `${BARRA_TOTAL.label}: `;
    else if (hasBoxChild)    prefixo = "Total de tarefas (recursivo): ";
    const termo = BARRA_TOTAL.term || (prefixo ? "concluídas" : "concluidas");

    let txt = `${prefixo}${d} / ${t} ${termo} (${pct}%)`;
    if (SHOW_TIME && mins > 0) txt += `  ·  ⏱ ${fmtTime(mins)}`;
    mainLabel.setText(txt);
    setBarVisual(mainFill, pct);

    if (hasBoxChild && directLabel && directFill) {
        const dd = root.children.filter(c => c.completed).length;
        const dt = root.children.length;
        const dp = dt > 0 ? Math.round(dd / dt * 100) : 0;
        const nome = BARRA_FILHAS.label || "Filhas diretas";
        const tF   = BARRA_FILHAS.term  || "concluídas";
        directLabel.setText(`${nome}: ${dd} / ${dt} ${tF} (${dp}%)`);
        setBarVisual(directFill, dp, DIRECT_COLORS);
    }
}
updateMainBar();

let directTimeEl = null;
if (SHOW_TIME && ownMinutos > 0) {
    directTimeEl = masterWrapper.createEl("div", {
        text: `📖 Registrado diretamente nesta nota — 🕒 ${fmtTime(ownMinutos)}`,
        attr: { style: "opacity: 0.6; font-size: 0.85em; margin: 2px 0 8px 0;" }
    });
}

// ══════════════════════════════════════════════════════════════════════
// 5. CAMADA 2: VIEW & PRESENTATION
// ══════════════════════════════════════════════════════════════════════

let listContainer = null;
if (entries.length === 0) {
    dv.paragraph("*Nenhuma nota vinculada ainda.*");
} else {
    const container = masterWrapper.createEl("div", "");
    listContainer = container;

    // updateNodeUI: única fonte de verdade para atualizar um nó no DOM
    function updateNodeUI(node) {
        const u = node.ui;
        if (!u) return;

        if (u.checkbox) u.checkbox.checked = node.completed;
        if (u.linkSpan) {
            u.linkSpan.style.textDecoration = node.completed ? "line-through" : "none";
            u.linkSpan.style.opacity        = node.completed ? "0.6" : "1";
        }
        if (u.linkEl && node.page?.file) {
            const lbl = node.displayName || node.page.file.name;
            u.linkEl.setText(lbl);
            if (node.page.file.path) {
                if (typeof u.linkEl.setAttribute === "function") {
                    u.linkEl.setAttribute("href", node.page.file.path);
                    u.linkEl.setAttribute("data-href", node.page.file.path);
                } else {
                    u.linkEl.href = node.page.file.path;
                }
            }
        }
        if (u.badgeSpan) u.badgeSpan.setText(`${node.doneLeaves}/${node.totalLeaves}`);

        // Tag de conclusão
        if (node.completed && node.doneDate) {
            if (u.doneSpan) {
                u.doneSpan.setText(` ✅ ${node.doneDate}`);
            } else if (u.row) {
                u.doneSpan = u.row.createEl("span", {
                    text: ` ✅ ${node.doneDate}`,
                    attr: { style: "color: #4caf50; opacity: 0.85; font-size: 0.9em;" }
                });
            }
        } else if (u.doneSpan) {
            u.doneSpan.remove();
            u.doneSpan = null;
        }

        // Barra da sub-caixa
        if (u.barLabel && u.barFill) {
            const { txt, pct } = subBarText(node);
            u.barLabel.setText(txt);
            setBarVisual(u.barFill, pct);
        }

        // Tag de tempo — usa node.totalMinutes como única fonte de verdade
        if (SHOW_TIME && u.row && !node.isGhost) {
            const min = node.totalMinutes || 0;
            if (min > 0) {
                if (u.timeSpan) {
                    u.timeSpan.setText(` 🕒 ${fmtTime(min)}`);
                } else {
                    u.timeSpan = u.row.createEl("span", {
                        text: ` 🕒 ${fmtTime(min)}`,
                        attr: { style: "opacity: 0.85; font-size: 0.85em;" }
                    });
                }
            } else if (u.timeSpan) {
                u.timeSpan.remove();
                u.timeSpan = null;
            }
        }
    }

    // onLeafToggle: atualiza memória → updateNodeUI (sem lógica visual inline)
    async function onLeafToggle(node) {
        if (!window.__autoTaskLastAction) window.__autoTaskLastAction = {};
        window.__autoTaskLastAction[VIEW_KEY] = Date.now();

        const isNow    = node.ui.checkbox.checked;
        const newDate  = isNow ? today() : null;

        // 1. Atualiza estado em memória da folha
        node.completed  = isNow;
        node.doneLeaves = isNow ? 1 : 0;
        node.doneDate   = newDate;

        // 2. Atualiza UI da folha via updateNodeUI (zero duplicação de lógica)
        updateNodeUI(node);

        // 3. Propaga ascendentemente: recalcula e atualiza UI de cada ancestral
        let cur = node.parent;
        while (cur) {
            recomputeNode(cur);
            updateNodeUI(cur);
            cur = cur.parent;
        }
        updateMainBar();

        // 4. Persistência em disco (folha, raiz e boxes intermediárias)
        await saveNodeStatus(node);
        await saveNodeStatus(root);
        await syncIntermediateBoxes(root);

        // Renova carimbo após todos os writes para absorver o eco do Obsidian
        window.__autoTaskLastAction[VIEW_KEY] = Date.now();
    }

    function renderRow(parentEl, node, depth) {
        const p       = node.page;
        const label   = node.displayName || p.file.name;
        const isBox   = node.isBox;
        const isGhost = node.isGhost;
        const min     = node.totalMinutes || 0;

        const row = parentEl.createEl("div", {
            attr: { style: "margin: 4px 0; display: flex; align-items: center; gap: 6px;" }
        });

        // Seta de expansão (só em modo recursivo)
        let arrow = null;
        if (RECURSIVO) {
            if (isBox) {
                const expanded = expandedSet ? expandedSet.has(p.file.path) : false;
                arrow = row.createEl("span", {
                    text: expanded ? "▾" : "▸",
                    attr: { style: "display: inline-flex; align-items: center; justify-content: center; width: 14px; cursor: pointer; user-select: none; opacity: 0.7; font-size: 0.85em; font-family: monospace;" }
                });
                arrow.addEventListener("mouseenter", () => { arrow.style.opacity = "1"; });
                arrow.addEventListener("mouseleave", () => { arrow.style.opacity = "0.7"; });
            } else {
                row.createEl("span", { attr: { style: "display: inline-block; width: 14px;" } });
            }
        }

        // Checkbox
        const checkbox = row.createEl("input", { type: "checkbox" });
        checkbox.checked = node.completed;
        if (isBox || isGhost) checkbox.disabled = true;

        // Link da nota
        const linkSpan = row.createEl("span");
        linkSpan.style.textDecoration = node.completed ? "line-through" : "none";
        linkSpan.style.opacity        = node.completed ? "0.6" : "1";
        const linkEl = linkSpan.createEl("a", {
            text: label, href: p.file.path,
            cls: isGhost ? ["internal-link", "is-unresolved"] : "internal-link",
            attr: { "data-href": p.file.path }
        });

        // Badge de contagem (só boxes)
        let badgeSpan = null;
        if (isBox) {
            badgeSpan = row.createEl("span", {
                text: `${node.doneLeaves}/${node.totalLeaves}`,
                attr: { style: "opacity: 0.8; font-size: 0.85em;" }
            });
        }

        // Tag de tempo
        let timeSpan = null;
        if (SHOW_TIME && min > 0) {
            timeSpan = row.createEl("span", {
                text: ` 🕒 ${fmtTime(min)}`,
                attr: { style: "opacity: 0.85; font-size: 0.85em;" }
            });
        }

        // Tag de conclusão
        let doneSpan = null;
        if (node.completed && node.doneDate) {
            doneSpan = row.createEl("span", {
                text: ` ✅ ${node.doneDate}`,
                attr: { style: "color: #4caf50; opacity: 0.85; font-size: 0.9em;" }
            });
        }

        // Barra proporcional ASCII (nível 0, modo barras)
        if (depth === 0 && SHOW_TIME && SHOW_TIME_BARS && min > 0 && totalMinutos > 0) {
            const pctT = (min / totalMinutos) * 100;
            const bars = "█".repeat(Math.round(pctT / 5));
            parentEl.createEl("div", {
                text: `⏱️  ${bars.padEnd(20, "░")}▏ ${pctT.toFixed(1)}%`,
                attr: { style: `margin: -2px 0 6px ${RECURSIVO ? 46 : 26}px; font-size: 0.7em; opacity: 0.5;` }
            });
        }

        node.ui = { row, checkbox, linkSpan, linkEl, badgeSpan, timeSpan, doneSpan, barLabel: null, barFill: null, subContainer: null };

        // Sub-caixa com lazy rendering (filhos só renderizados ao expandir)
        if (isBox) {
            const isExpanded = expandedSet ? expandedSet.has(p.file.path) : false;
            const subContainer = parentEl.createEl("div", {
                attr: { style: "margin-left: 20px; padding-left: 8px; border-left: 1px solid var(--background-modifier-border, rgba(255,255,255,0.12));" }
            });
            subContainer.style.display = isExpanded ? "block" : "none";
            node.ui.subContainer = subContainer;

            const { label: bLabel, fill: bFill } = createBar(subContainer, true);
            node.ui.barLabel = bLabel;
            node.ui.barFill  = bFill;
            const { txt, pct } = subBarText(node);
            bLabel.setText(txt);
            setBarVisual(bFill, pct);

            let childrenRendered = false;
            function renderSubChildren() {
                if (childrenRendered) return;
                childrenRendered = true;
                renderChecklist(subContainer, sortNodes(node.children, node.hasOrder), depth + 1);
            }

            if (isExpanded) renderSubChildren();

            arrow.addEventListener("click", () => {
                const nowExpanded = subContainer.style.display === "none";
                subContainer.style.display = nowExpanded ? "block" : "none";
                arrow.setText(nowExpanded ? "▾" : "▸");
                if (expandedSet) {
                    if (nowExpanded) expandedSet.add(p.file.path);
                    else expandedSet.delete(p.file.path);
                }
                if (nowExpanded) renderSubChildren();
            });
        } else if (!isGhost) {
            checkbox.addEventListener("click", () => onLeafToggle(node));
        }
    }

    function renderChecklist(el, list, depth) {
        for (const node of list) renderRow(el, node, depth);
    }

    renderChecklist(container, entries, 0);
}

// Seamless Swap: remove wrapper antigo, exibe o novo, zero frame em branco
if (cachedView?.wrapper && cachedView.wrapper !== masterWrapper) {
    if (typeof cachedView.wrapper.remove === "function") {
        cachedView.wrapper.remove();
    } else if (containerEl && Array.isArray(containerEl.children)) {
        const idx = containerEl.children.indexOf(cachedView.wrapper);
        if (idx !== -1) containerEl.children.splice(idx, 1);
    }
}
masterWrapper.style.display = "";

// Registra a view no cache global (por VIEW_KEY = container instance e por path)
const viewCacheData = {
    wrapper:       masterWrapper,
    listContainer: listContainer,
    root,
    entries,
    entryPaths:    currentEntryPaths,
    updateMainBar,
    updateNodeUI:  typeof updateNodeUI === "function" ? updateNodeUI : null,
    directTimeEl
};
if (containerEl) containerEl.__autoTaskView = viewCacheData;
window.__autoTaskActiveViews.set(VIEW_KEY, viewCacheData);

// Persistência em disco (a UI já está visível, saves não bloqueiam a experiência)
await saveNodeStatus(root);
await syncIntermediateBoxes(root);
