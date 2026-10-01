const { createSuite, runScenario, assert, assertEqual, assertIncludes } = require("../helpers/runner");
const { findBars, findCheckboxes, findLinks } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Ghost Notes");

suite.test("ghost: bar shows correct leaf count", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "ghost/a) notas fantasmas.md", inputVal: { recursivo: false }
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 1, `Expected bar, got ${bars.length}`);
    assertIncludes(bars[0], "/ 3", "ghost bar total");
});

suite.test("ghost: 3 checkboxes, 2 disabled (ghosts)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "ghost/a) notas fantasmas.md", inputVal: { recursivo: false }
    });
    const cbs = findCheckboxes(topContainer);
    assertEqual(cbs.length, 3, "checkbox count");
    const disabledCount = cbs.filter(c => c.disabled).length;
    assertEqual(disabledCount, 2, "disabled checkboxes (ghosts)");
});

suite.test("ghost: alias 'fantasma 3' is displayed", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "ghost/a) notas fantasmas.md", inputVal: { recursivo: false }
    });
    const links = findLinks(topContainer);
    assert(links.some(l => l.textContent === "fantasma 3"),
        `Expected alias "fantasma 3", found: ${links.map(l => l.textContent)}`);
});

suite.test("ghost: unresolved links have 'is-unresolved' class", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "ghost/a) notas fantasmas.md", inputVal: undefined
    });
    const links = findLinks(topContainer);
    const unresolvedLinks = links.filter(l => {
        const cls = l._cls;
        if (Array.isArray(cls)) return cls.includes("is-unresolved");
        if (typeof cls === "string") return cls.includes("is-unresolved");
        return false;
    });
    assertEqual(unresolvedLinks.length, 2, "unresolved link count");
});

module.exports = suite;
