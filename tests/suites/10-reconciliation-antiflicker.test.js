const { createSuite, runScenario, assert, assertEqual, viewCode } = require("../helpers/runner");
const { createElMock, findBars, findLinks } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Reconciliation, Anti-Flicker & Fast Path");

suite.test("anti-flicker: self-triggered refresh reuses cached wrapper without rebuilding DOM", async () => {
    const pages = createTestPages();
    const currentPg = pages.find(p => p.file.path.startsWith("recursive/Caixa A"));

    const topContainer = createElMock("div");
    const VIEW_KEY_MOCK = currentPg.file.path + "|test-anti-flicker";
    topContainer.__autoTaskId = VIEW_KEY_MOCK;

    const mockWrapper = createElMock("div");
    mockWrapper.textContent = "CACHED_VIEW";

    const windowMock = {
        __autoTaskLastAction: { [VIEW_KEY_MOCK]: Date.now() },
        __autoTaskActiveViews: new Map([[VIEW_KEY_MOCK, { wrapper: mockWrapper }]])
    };

    const dv = {
        current: () => currentPg,
        container: topContainer,
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
    await fn(dv, app, windowMock, undefined);

    assert(topContainer.children.includes(mockWrapper), "Should reuse cached wrapper element");
});

suite.test("seamless swap: external refresh maintains previous wrapper to prevent white-flash", async () => {
    const pages = createTestPages();
    const currentPg = pages.find(p => p.file.path.startsWith("recursive/Caixa A"));
    const mockWrapper = createElMock("div");
    mockWrapper.textContent = "OLD_WRAPPER";

    const topContainer = createElMock("div");
    const VIEW_KEY_MOCK = currentPg.file.path + "|test-seamless-swap";
    topContainer.__autoTaskId = VIEW_KEY_MOCK;

    const windowMock = {
        __autoTaskLastAction: { [VIEW_KEY_MOCK]: 0 },
        __autoTaskActiveViews: new Map([[VIEW_KEY_MOCK, { wrapper: mockWrapper }]])
    };

    const dv = {
        current: () => currentPg,
        container: topContainer,
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
    await fn(dv, app, windowMock, undefined);

    const newCached = windowMock.__autoTaskActiveViews.get(VIEW_KEY_MOCK);
    assert(newCached && newCached.wrapper !== mockWrapper, "Should produce updated masterWrapper");
    assert(topContainer.children.includes(newCached.wrapper), "topContainer should contain the new masterWrapper");
});

suite.test("in-place reconciliation: updates existing nodes when child changes externally", async () => {
    const customPages = createTestPages();
    const currentPg = customPages.find(p => p.file.path.startsWith("recursive/Caixa A"));
    const topContainer = createElMock("div");
    topContainer.isConnected = true;
    const windowMock = {};

    const makeDv = () => ({
        current: () => currentPg,
        container: topContainer,
        pages: () => Object.assign([...customPages], { where: fn => customPages.filter(fn) }),
        page: p => customPages.find(x => x.file.path === p || x.file.name === p),
        el: (t) => createElMock(t),
        paragraph: (t) => createElMock("p")
    });
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

    // First run: builds initial DOM
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const viewKey = topContainer.__autoTaskId;
    const cached1 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(cached1 && cached1.root, "Should cache view state");
    assertEqual(cached1.root.doneLeaves, 3, "Initial done leaves 3");

    // External update: mark Tarefa 2 as completed AND change Tarefa 4 tracker time
    const t2 = customPages.find(p => p.file.name === "Tarefa 2");
    t2.completed = true;
    t2.done = "2026-09-26";

    const t4 = customPages.find(p => p.file.name === "Tarefa 4");
    t4._content = `---
completed: true
done: 2026-09-24
---
\`\`\`simple-time-tracker
{"entries":[{"name":"Segment 1","startTime":"2026-09-24T18:00:53.000Z","endTime":"2026-09-24T19:37:54.000Z"}]}
\`\`\``;
    if (windowMock.__TheBoxTimeCache) windowMock.__TheBoxTimeCache.delete(t4.file.path);

    // Second run: should trigger Fast Path (in-place reconciliation)
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const cached2 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(cached1.wrapper === cached2.wrapper, "Should reuse the same masterWrapper DOM instance");
    assertEqual(cached2.root.doneLeaves, 4, "Updated done leaves to 4 in-place");

    // Verify total time updated in main bar to 3h 37min (was 2h 37min)
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("3h 37min")), `Main bar should reflect new time 3h 37min, got: ${bars}`);

    // Third run: complete Tarefa 3, which completes intermediate Caixa B
    const t3 = customPages.find(p => p.file.name === "Tarefa 3");
    t3.completed = true;
    t3.done = "2026-09-26";
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const cached3 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(cached1.wrapper === cached3.wrapper, "Should reuse masterWrapper even when intermediate box completes");
    assertEqual(cached3.root.doneLeaves, 5, "Updated done leaves to 5 in-place");

    // Fourth run: uncheck Tarefa 3, which uncompletes intermediate Caixa B
    t3.completed = false;
    t3.done = null;
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const cached4 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(cached1.wrapper === cached4.wrapper, "Should reuse masterWrapper even when intermediate box uncompletes");
    assertEqual(cached4.root.doneLeaves, 4, "Updated done leaves back to 4 in-place");
});

suite.test("rapid external toggles on intermediate box child: no lockout or lag on second toggle", async () => {
    const customPages = createTestPages();
    const currentPg = customPages.find(p => p.file.path.startsWith("recursive/Caixa A"));
    const topContainer = createElMock("div");
    topContainer.isConnected = true;
    const windowMock = {};

    const makeDv = () => ({
        current: () => currentPg,
        container: topContainer,
        pages: () => Object.assign([...customPages], { where: fn => customPages.filter(fn) }),
        page: p => customPages.find(x => x.file.path === p || x.file.name === p),
        el: (t) => createElMock(t),
        paragraph: (t) => createElMock("p")
    });
    let writtenFiles = [];
    const app = {
        vault: { getAbstractFileByPath: p => ({ path: p }), read: async () => "" },
        fileManager: {
            processFrontMatter: async (file, fn) => {
                const pg = customPages.find(x => x.file.path === file.path);
                if (pg) {
                    fn(pg);
                    writtenFiles.push(file.path);
                }
            }
        },
        metadataCache: { getFirstLinkpathDest: () => null }
    };

    const fn = new Function("dv", "app", "window", "input", `return (async () => {\n${viewCode}\n})();`);

    // 1. Initial render
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const viewKey = topContainer.__autoTaskId;
    const view1 = windowMock.__autoTaskActiveViews.get(viewKey);
    assertEqual(view1.root.doneLeaves, 3, "Initial done leaves: 3");

    // 2. First external toggle: complete Tarefa 3
    const t3 = customPages.find(p => p.file.name === "Tarefa 3");
    t3.completed = true;
    t3.done = "2026-09-26";
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const view2 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(view1.wrapper === view2.wrapper, "Reuses DOM wrapper");
    assertEqual(view2.root.doneLeaves, 4, "Done leaves after first toggle: 4");
    assert(writtenFiles.some(f => f.includes("Caixa B")), "Caixa B disk frontmatter was updated to complete");

    // 3. Second external toggle immediately after: uncomplete Tarefa 3
    writtenFiles = [];
    t3.completed = false;
    t3.done = null;
    await fn(makeDv(), app, windowMock, { recursivo: "True" });
    const view3 = windowMock.__autoTaskActiveViews.get(viewKey);
    assert(view1.wrapper === view3.wrapper, "Still reuses DOM wrapper without rebuild");
    assertEqual(view3.root.doneLeaves, 3, "Done leaves after rapid second toggle correctly updated back to 3");
    assert(writtenFiles.some(f => f.includes("Caixa B")), "Caixa B disk frontmatter was updated to incomplete");
});

suite.test("tree stability: editing unrelated external note does NOT cause tasks to jump positions", async () => {
    // Regression test for the bug where completed tasks jumped to bottom on external note edits
    const customPages = createTestPages();
    // Add an unrelated note
    customPages.push({
        file: { path: "notes/Unrelated Note.md", name: "Unrelated Note" },
        _content: "Some random text"
    });

    const currentPg = customPages.find(p => p.file.path.startsWith("recursive/Caixa A"));
    const topContainer = createElMock("div");
    topContainer.isConnected = true;
    const windowMock = {};

    const makeDv = () => ({
        current: () => currentPg,
        container: topContainer,
        pages: () => Object.assign([...customPages], { where: fn => customPages.filter(fn) }),
        page: p => customPages.find(x => x.file.path === p || x.file.name === p),
        el: (t) => createElMock(t),
        paragraph: (t) => createElMock("p")
    });
    const app = {
        vault: { getAbstractFileByPath: p => ({ path: p }), read: async () => "" },
        fileManager: { processFrontMatter: async () => {} },
        metadataCache: { getFirstLinkpathDest: () => null }
    };

    const fn = new Function("dv", "app", "window", "input", `return (async () => {\n${viewCode}\n})();`);

    // Render Caixa A with default manual sorting
    await fn(makeDv(), app, windowMock, { recursivo: false });
    const links1 = findLinks(topContainer).map(l => l.textContent);
    // Initial order: Tarefa 1 (completed: true), Tarefa 2, Caixa B
    assertEqual(links1[0], "Tarefa 1", "Tarefa 1 must be first");
    assertEqual(links1[1], "Tarefa 2", "Tarefa 2 must be second");
    assertEqual(links1[2], "Caixa B", "Caixa B must be third");

    // Now simulate an edit to the unrelated note
    const unrelated = customPages.find(p => p.file.name === "Unrelated Note");
    unrelated._content = "New content added to unrelated note";

    // Second render (Dataview refresh triggered by external edit)
    await fn(makeDv(), app, windowMock, { recursivo: false });
    const links2 = findLinks(topContainer).map(l => l.textContent);

    // Tarefa 1 MUST NOT have jumped to the end!
    assertEqual(links2[0], "Tarefa 1", "Tarefa 1 MUST remain first after external note edit");
    assertEqual(links2[1], "Tarefa 2", "Tarefa 2 MUST remain second");
    assertEqual(links2[2], "Caixa B", "Caixa B MUST remain third");
});

module.exports = suite;
