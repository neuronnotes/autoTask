const { createSuite, runScenario, assert, assertIncludes } = require("../helpers/runner");
const { findBars, findCheckboxes } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("theBox Reverse Index");

suite.test("total/CaixaA non-recursive: renders children from theBox", async () => {
    const pages = createTestPages();
    const totalCaixaA = pages.find(p => p.file.name === "Caixa A" && p.file.path.startsWith("total"));
    assert(totalCaixaA, "total/Caixa A fixture should exist");

    const { topContainer } = await runScenario({
        pages, currentName: totalCaixaA.file.path, inputVal: undefined
    });
    const cbs = findCheckboxes(topContainer);
    assert(cbs.length >= 2, `Expected at least 2 checkboxes, got ${cbs.length}`);
});

suite.test("total/CaixaA recursive: counts leaves", async () => {
    const pages = createTestPages();
    const totalCaixaA = pages.find(p => p.file.name === "Caixa A" && p.file.path.startsWith("total"));

    const { topContainer } = await runScenario({
        pages, currentName: totalCaixaA.file.path, inputVal: { recursivo: "True" }
    });
    const bars = findBars(topContainer);
    assert(bars.length >= 1, `Expected bar, got ${bars.length}`);
    assertIncludes(bars[0], "/ 5", "total leaves");
});

module.exports = suite;
