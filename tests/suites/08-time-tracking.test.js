const { createSuite, runScenario, assert } = require("../helpers/runner");
const { findBars, findAll } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Time Tracking & Bottom-up Aggregation");

suite.test("bottom-up time: Caixa B shows aggregated time from nested leaves (ignores stale totalTime)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const spans = findAll(topContainer, el => el.tagName === "SPAN" && el.textContent.includes("37min"));
    assert(spans.length > 0,
        `Expected "37min" time span for Caixa B (aggregated from Tarefa 4's tracker block)`);
});

suite.test("bottom-up time: root shows total from all nested leaves", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("2h 37min")),
        `Expected "2h 37min" in root bar, found: ${bars}`);
});

suite.test("bottom-up time: intermediate box with zeroed totalTime still shows real time", async () => {
    const pages = createTestPages();
    const bPage = pages.find(p => p.file.name === "Caixa B");
    const cPage = pages.find(p => p.file.name === "Caixa C");
    bPage.totalTime = null;
    cPage.totalTime = null;

    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const spans = findAll(topContainer, el => el.tagName === "SPAN" && el.textContent.includes("37min"));
    assert(spans.length > 0,
        `With totalTime: null on intermediaries, should still show "37min" from real tracker blocks`);
});

suite.test("bottom-up time: syncBoxStatus does NOT write totalTime to disk", async () => {
    const pages = createTestPages();
    const caixaA = pages.find(p => p.file.name === "Caixa A");
    caixaA.completed = true; // force different so syncBoxStatus triggers

    const { frontMatterWrites } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const boxWrite = frontMatterWrites.find(w => w.path.includes("Caixa A"));
    if (boxWrite) {
        assert(!('totalTime' in boxWrite) || boxWrite.totalTime === caixaA.totalTime,
            `syncBoxStatus should NOT write totalTime, but got: ${JSON.stringify(boxWrite)}`);
    }
});

suite.test("time cache: re-reading updated file reflects new time without restarting", async () => {
    const pages = createTestPages();
    const t4 = pages.find(p => p.file.name === "Tarefa 4");
    const run1 = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const bars1 = findBars(run1.topContainer);
    assert(bars1.some(b => b.includes("2h 37min")), `Expected 2h 37min initially, got: ${bars1}`);

    // Update Tarefa 4 content with 60 additional minutes
    t4._content = `---
completed: true
done: 2026-09-24
---
\`\`\`simple-time-tracker
{"entries":[{"name":"Segment 1","startTime":"2026-09-24T18:00:53.000Z","endTime":"2026-09-24T19:37:54.000Z"}]}
\`\`\``;

    if (run1.windowMock.__TheBoxTimeCache) {
        run1.windowMock.__TheBoxTimeCache.delete(t4.file.path);
    }

    const run2 = await runScenario({
        pages, currentName: "Caixa A", inputVal: { recursivo: "True" }
    });
    const bars2 = findBars(run2.topContainer);
    assert(bars2.some(b => b.includes("3h 37min")), `Expected 3h 37min after time update, got: ${bars2}`);
});

suite.test("barras: renders ascii time bar when enabled", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { barras: "True" }
    });
    const timeBars = findAll(topContainer, el => el.tagName === "DIV" && el.textContent.includes("⏱️"));
    assert(timeBars.length > 0, "Should render ascii time bars");
});

module.exports = suite;
