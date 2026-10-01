const { createSuite, runScenario, assert, assertEqual } = require("../helpers/runner");
const { findBars, findCheckboxes, findLinks, findAll, fireEvent } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Checkbox Interaction & Simulation");

suite.test("click: toggling unchecked task updates bar and frontmatter", async () => {
    const pages = createTestPages();
    const { topContainer, frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: undefined  // non-recursive
    });
    const links = findLinks(topContainer);

    let t2Cb = null;
    for (const link of links) {
        if (link.textContent === "Tarefa 2") {
            const row = link._parent?._parent;
            if (row) {
                t2Cb = findAll(row, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
            }
            break;
        }
    }
    assert(t2Cb, "Tarefa 2 checkbox should exist");
    assert(!t2Cb.checked, "Tarefa 2 should be unchecked initially");
    assert(!t2Cb.disabled, "Tarefa 2 checkbox should be enabled");

    t2Cb.checked = true;
    const writesBefore = frontMatterWrites.length;
    await fireEvent(t2Cb, "click");

    const newWrites = frontMatterWrites.slice(writesBefore);
    assert(newWrites.length >= 1, `Expected frontmatter write after click, got ${newWrites.length}`);

    const t2Write = newWrites.find(w => w.path.includes("Tarefa 2"));
    assert(t2Write, "Should have written to Tarefa 2");
    assertEqual(t2Write.completed, true, "Tarefa 2 completed");
    assert(t2Write.done, "Tarefa 2 should have done date");
});

suite.test("click: recursive mode refreshes all bars on toggle", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const links = findLinks(topContainer);

    let t2Cb = null;
    for (const link of links) {
        if (link.textContent === "Tarefa 2") {
            const row = link._parent?._parent;
            if (row) {
                t2Cb = findAll(row, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
            }
            break;
        }
    }
    assert(t2Cb, "Tarefa 2 checkbox should exist");
    t2Cb.checked = true;
    await fireEvent(t2Cb, "click");

    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("4 / 5") && b.includes("80%")),
        `Expected updated bar "4/5 (80%)", found: ${bars}`);
});

suite.test("click: unchecking a checked task decrements count", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: undefined // non-recursive
    });
    const links = findLinks(topContainer);

    let t1Cb = null;
    for (const link of links) {
        if (link.textContent === "Tarefa 1") {
            const row = link._parent?._parent;
            if (row) {
                t1Cb = findAll(row, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
            }
            break;
        }
    }
    assert(t1Cb, "Tarefa 1 checkbox should exist");
    assert(t1Cb.checked, "Tarefa 1 should be checked initially");

    t1Cb.checked = false;
    await fireEvent(t1Cb, "click");

    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("0 / 3") && b.includes("0%")),
        `Expected "0/3 (0%)" after uncheck, found: ${bars}`);
});

module.exports = suite;
