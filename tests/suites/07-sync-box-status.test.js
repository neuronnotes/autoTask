const { createSuite, runScenario, assert, assertEqual } = require("../helpers/runner");
const { findLinks, findAll, fireEvent } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Box Status Synchronization");

suite.test("syncBoxStatus: writes completed=false when not all done", async () => {
    const pages = createTestPages();
    const { frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const boxWrite = frontMatterWrites.find(w => w.path.includes("Caixa A") && w.path.includes("recursive"));
    if (boxWrite) {
        assertEqual(boxWrite.completed, false, "Caixa A completed");
    }
});

suite.test("syncBoxStatus: when all tasks done, marks box complete", async () => {
    const pages = createTestPages();
    for (const p of pages) {
        if (p.file.path.startsWith("recursive/Tarefa")) {
            p.completed = true;
            p.done = "2026-09-24";
        }
    }
    const { frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const boxWrite = frontMatterWrites.find(w => w.path.includes("recursive/Caixa A"));
    assert(boxWrite, "Should write frontmatter for Caixa A");
    assertEqual(boxWrite.completed, true, "Caixa A completed when all done");
    assert(boxWrite.done, "Caixa A should have done date");
});

suite.test("intermediate sync: writes completed=true and done to intermediate box when leaves complete", async () => {
    const pages = createTestPages();
    const { topContainer, frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });

    // Expand Caixa B
    const arrows = findAll(topContainer, el => el.tagName === "SPAN" && el.textContent === "▸");
    assert(arrows.length > 0, "Should have collapse arrows");
    await fireEvent(arrows[0], "click");

    // Click Tarefa 3 to complete Caixa B
    const links = findLinks(topContainer);
    const t3Link = links.find(l => l.textContent === "Tarefa 3");
    assert(t3Link, "Tarefa 3 should be rendered after expansion");
    const t3Cb = findAll(t3Link._parent?._parent, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
    assert(t3Cb, "Tarefa 3 checkbox should exist");

    const writesBefore = frontMatterWrites.length;
    t3Cb.checked = true;
    await fireEvent(t3Cb, "click");

    const newWrites = frontMatterWrites.slice(writesBefore);
    assert(newWrites.some(w => w.path.includes("Tarefa 3")), "Should have written Tarefa 3");

    const bWrite = newWrites.find(w => w.path.includes("Caixa B"));
    assert(bWrite, `Intermediate box Caixa B should have been written to disk, writes: ${JSON.stringify(newWrites)}`);
    assertEqual(bWrite.completed, true, "Caixa B completed should be true");
    assert(bWrite.done, "Caixa B done should have date");
    assert(!('totalTime' in bWrite) || bWrite.totalTime === pages.find(p => p.file.name === "Caixa B").totalTime,
        "Intermediate sync should not inject or overwrite totalTime");
});

suite.test("intermediate sync: unchecking leaf marks intermediate box incomplete on disk", async () => {
    const pages = createTestPages();
    const t3Page = pages.find(p => p.file.name === "Tarefa 3");
    t3Page.completed = true;
    t3Page.done = "2026-09-24";
    const bPage = pages.find(p => p.file.name === "Caixa B");
    bPage.completed = true;
    bPage.done = "2026-09-24";

    const { topContainer, frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });

    const arrows = findAll(topContainer, el => el.tagName === "SPAN" && el.textContent === "▸");
    await fireEvent(arrows[0], "click");

    const links = findLinks(topContainer);
    const t3Link = links.find(l => l.textContent === "Tarefa 3");
    const t3Cb = findAll(t3Link._parent?._parent, e => e.tagName === "INPUT" && e._type === "checkbox")[0];
    assert(t3Cb.checked, "Tarefa 3 should be checked initially");

    const writesBefore = frontMatterWrites.length;
    t3Cb.checked = false;
    await fireEvent(t3Cb, "click");

    const newWrites = frontMatterWrites.slice(writesBefore);
    const bWrite = newWrites.find(w => w.path.includes("Caixa B"));
    assert(bWrite, "Caixa B should have frontmatter write on uncheck");
    assertEqual(bWrite.completed, false, "Caixa B completed should be false");
    assertEqual(bWrite.done, null, "Caixa B done should be null");
});

suite.test("intermediate sync: does NOT write to intermediate box if state didn't change", async () => {
    const pages = createTestPages();
    const { topContainer, frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });

    const links = findLinks(topContainer);
    const t2Link = links.find(l => l.textContent === "Tarefa 2");
    const t2Cb = findAll(t2Link._parent?._parent, e => e.tagName === "INPUT" && e._type === "checkbox")[0];

    const writesBefore = frontMatterWrites.length;
    t2Cb.checked = true;
    await fireEvent(t2Cb, "click");

    const newWrites = frontMatterWrites.slice(writesBefore);
    assert(newWrites.some(w => w.path.includes("Tarefa 2")), "Should write Tarefa 2");
    assert(!newWrites.some(w => w.path.includes("Caixa B")),
        `Caixa B should NOT be written if its completed status didn't change, got: ${JSON.stringify(newWrites)}`);
});

module.exports = suite;
