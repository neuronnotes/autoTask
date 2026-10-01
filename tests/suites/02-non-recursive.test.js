const { createSuite, runScenario, assert, assertEqual, assertIncludes } = require("../helpers/runner");
const { findBars, findCheckboxes } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Non-Recursive Mode");

suite.test("non-recursive: bar shows 1/3 (33%)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: false }
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 1, `Expected at least 1 bar, got ${bars.length}`);
    assertIncludes(bars[0], "1 / 3", "main bar");
    assertIncludes(bars[0], "33%", "percentage");
});

suite.test("non-recursive: only 1 bar (no direct children bar)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: false }
    });
    const bars = findBars(topContainer);
    assertEqual(bars.length, 1, "number of bars");
});

suite.test("non-recursive: 3 checkboxes rendered", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: false }
    });
    const cbs = findCheckboxes(topContainer);
    assertEqual(cbs.length, 3, "checkbox count");
});

module.exports = suite;
