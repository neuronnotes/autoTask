const { createSuite, runScenario, assert, assertEqual, viewCode } = require("../helpers/runner");
const { createElMock, findBars, findLinks, findAll, fireEvent, getRenderedTexts } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Memory, Lifecycle & Garbage Collection");

suite.test("empty box: shows 'nenhuma nota' paragraph", async () => {
    const pages = createTestPages();
    const emptyPage = {
        file: { path: "test/Empty.md", name: "Empty" },
        theBox: null, order: [], completed: null, done: null, totalTime: null,
        _content: "---\norder: []\n---\n"
    };
    const { rendered } = await runScenario({
        pages: [...pages, emptyPage], currentName: "test/Empty.md", inputVal: undefined
    });
    const texts = getRenderedTexts(rendered);
    assert(texts.some(t => t.includes("Nenhuma nota")),
        `Expected empty message, got: ${texts}`);
});

suite.test("dv.view() without second arg uses defaults from default.md", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: undefined
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 1, `Expected at least 1 bar, got ${bars.length}`);
});

suite.test("window caches are created for recursive mode", async () => {
    const pages = createTestPages();
    const { windowMock } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    assert(windowMock.__TheBoxExpandedByFile instanceof Map,
        "Should create __TheBoxExpandedByFile");
});

suite.test("vault hook registered once with reference (not boolean flag)", async () => {
    const pages = createTestPages();
    const { windowMock } = await runScenario({
        pages, currentName: "Caixa A", inputVal: {}
    });
    assert(
        windowMock.__autoTaskVaultHook === undefined ||
        typeof windowMock.__autoTaskVaultHook === "function",
        "Vault hook should be a function reference or undefined (in test env)"
    );
    assert(windowMock.__autoTaskVaultHooked === undefined,
        "Old __autoTaskVaultHooked boolean should not exist in v3");
});

suite.test("two tabs of same note get independent views (no blank tab)", async () => {
    const customPages = createTestPages();
    const currentPg = customPages.find(p => p.file.path.startsWith("recursive/Caixa A"));

    const containerTab1 = createElMock("div");
    containerTab1.isConnected = true;
    const containerTab2 = createElMock("div");
    containerTab2.isConnected = true;

    const windowMock = {};

    const app = {
        vault: {
            getAbstractFileByPath: (p) => {
                const pg = customPages.find(x => x.file.path === p);
                return pg ? { path: pg.file.path } : {};
            },
            read: async (f) => {
                const pg = customPages.find(x => x.file.path === (f.path || f));
                return pg ? pg._content : "";
            }
        },
        fileManager: { processFrontMatter: async () => {} },
        metadataCache: { getFirstLinkpathDest: () => null }
    };

    const fn = new Function("dv", "app", "window", "input", `return (async () => {\n${viewCode}\n})();`);

    const makeDv = (container) => ({
        current: () => currentPg,
        container,
        pages: () => Object.assign([...customPages], { where: fn => customPages.filter(fn) }),
        page: p => customPages.find(x => x.file.path === p || x.file.name === p),
        el: (t) => createElMock(t),
        paragraph: (t) => createElMock("p")
    });

    // Render tab 1
    await fn(makeDv(containerTab1), app, windowMock, { recursivo: "True" });
    const key1 = containerTab1.__autoTaskId;
    const view1 = windowMock.__autoTaskActiveViews.get(key1);
    assert(view1 && view1.root, "Tab 1 should have a rendered view");

    // Render tab 2
    await fn(makeDv(containerTab2), app, windowMock, { recursivo: "True" });
    const key2 = containerTab2.__autoTaskId;
    const view2 = windowMock.__autoTaskActiveViews.get(key2);
    assert(view2 && view2.root, "Tab 2 should have a rendered view (not blank)");

    assert(key1 !== key2, "VIEW_KEYs should differ between tabs");
    assert(view1.wrapper !== view2.wrapper, "Each tab should have its own DOM wrapper");
    assertEqual(view1.root.doneLeaves, view2.root.doneLeaves, "Both tabs show same data");
});

suite.test("lazy rendering: collapsed sub-box renders children only upon expansion", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });

    let links = findLinks(topContainer);
    assert(!links.some(l => l.textContent === "Tarefa 3"), "Tarefa 3 should not be mounted yet");

    const arrows = findAll(topContainer, el => el.tagName === "SPAN" && el.textContent === "▸");
    assert(arrows.length > 0, "Should have collapse arrows");
    await fireEvent(arrows[0], "click");

    links = findLinks(topContainer);
    assert(links.some(l => l.textContent === "Tarefa 3"), "Tarefa 3 should be mounted after expansion");
});

suite.test("garbage collection: purges disconnected views from window.__autoTaskActiveViews", async () => {
    const pages = createTestPages();
    const currentPg = pages.find(p => p.file.path.startsWith("recursive/Caixa A"));

    // Pre-populate windowMock with an active view and a closed/orphaned view
    const orphanWrapper = createElMock("div");
    orphanWrapper.isConnected = false; // Closed tab!

    const windowMock = {
        __autoTaskActiveViews: new Map([
            ["closed-tab-key", { wrapper: orphanWrapper }]
        ])
    };

    const containerEl = createElMock("div");
    containerEl.isConnected = true;

    const dv = {
        current: () => currentPg,
        container: containerEl,
        pages: () => Object.assign([...pages], { where: fn => pages.filter(fn) }),
        page: p => pages.find(x => x.file.path === p || x.file.name === p),
        el: (t) => createElMock(t),
        paragraph: (t) => createElMock("p")
    };
    const app = {
        vault: { getAbstractFileByPath: () => ({}), read: async () => "" },
        fileManager: { processFrontMatter: async () => {} },
        metadataCache: { getFirstLinkpathDest: () => null }
    };

    const fn = new Function("dv", "app", "window", "input", `return (async () => {\n${viewCode}\n})();`);
    await fn(dv, app, windowMock, { recursivo: false });

    // The orphan view should have been purged during GC!
    assert(!windowMock.__autoTaskActiveViews.has("closed-tab-key"),
        "Closed tab's orphaned view should be purged by garbage collector");
});

module.exports = suite;
