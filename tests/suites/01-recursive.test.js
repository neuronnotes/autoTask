const { createSuite, runScenario, assert, assertIncludes } = require("../helpers/runner");
const { findBars, findBadges, findCheckboxes, findLinks, findDoneSpans, findAll } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Recursive Mode");

suite.test("recursive: bar shows 3/5 leaves (60%)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 1, `Expected at least 1 bar, got ${bars.length}`);
    assertIncludes(bars[0], "3 / 5", "main bar count");
    assertIncludes(bars[0], "60%", "main bar percentage");
});

suite.test("recursive: direct children bar shows 1/3 (33%)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 2, `Expected 2 bars, got ${bars.length}`);
    assertIncludes(bars[1], "1 / 3", "direct bar count");
    assertIncludes(bars[1], "33%", "direct bar percentage");
});

suite.test("recursive: Caixa B shows badge 2/3", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const badges = findBadges(topContainer);
    assert(badges.some(b => b.textContent === "2/3"),
        `Expected badge "2/3", found: ${badges.map(b => b.textContent)}`);
});

suite.test("recursive: Tarefa 1 checkbox is checked", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const links = findLinks(topContainer);
    let t1Checked = false;
    for (const link of links) {
        if (link.textContent === "Tarefa 1") {
            const row = link._parent?._parent;
            if (row) {
                const cb = findAll(row, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
                if (cb) t1Checked = cb.checked;
            }
            break;
        }
    }
    assert(t1Checked, "Tarefa 1 checkbox should be checked");
});

suite.test("recursive: Caixa B checkbox is disabled", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const links = findLinks(topContainer);
    for (const link of links) {
        if (link.textContent === "Caixa B") {
            const row = link._parent?._parent;
            if (row) {
                const cb = findAll(row, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
                assert(cb && cb.disabled, "Caixa B checkbox should be disabled");
            }
            return;
        }
    }
    throw new Error("Caixa B link not found");
});

suite.test("recursive: done spans show dates for completed tasks", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const doneSpans = findDoneSpans(topContainer);
    assert(doneSpans.length >= 1, `Expected done spans, got ${doneSpans.length}`);
    assert(doneSpans.some(s => s.textContent.includes("2026-09-24")),
        "Should show 2026-09-24 as done date");
});

module.exports = suite;
