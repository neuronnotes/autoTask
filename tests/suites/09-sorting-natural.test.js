const { createSuite, runScenario, assert, assertEqual } = require("../helpers/runner");
const { findLinks } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Natural Sorting & Stable Tie-Breaker");

suite.test("natural alphanumeric sort: sorts numbers naturally (Ciclo 1, Ciclo 2, Ciclo 9, Ciclo 10, Ciclo 20)", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "sort/Caixa Ciclos.md", inputVal: { sortBy: "name" }
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);

    assertEqual(names[0], "Ciclo 1", "First item");
    assertEqual(names[1], "Ciclo 2", "Second item");
    assertEqual(names[2], "Ciclo 9", "Third item");
    assertEqual(names[3], "Ciclo 10", "Fourth item (10 after 9, not before 2)");
    assertEqual(names[4], "Ciclo 20", "Fifth item");
});

suite.test("natural sort with theBox: sorts reverse indexed notes naturally", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "sort/Caixa Alfanumerica TheBox.md", inputVal: { sortBy: "name" }
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);

    assertEqual(names[0], "Capítulo 1", "First item");
    assertEqual(names[1], "Capítulo 2", "Second item");
    assertEqual(names[2], "Capítulo 10", "Third item (10 after 2)");
    assertEqual(names[3], "Capítulo 20", "Fourth item");
});

suite.test("sortBy=manual: respects order from frontmatter", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { sortBy: "manual" }
    });
    const links = findLinks(topContainer);
    const topLevelNames = links.slice(0, 3).map(l => l.textContent);

    assertEqual(topLevelNames[0], "Tarefa 1", "first item");
    assertEqual(topLevelNames[1], "Tarefa 2", "second item");
    assertEqual(topLevelNames[2], "Caixa B", "third item");
});

suite.test("sortDir=desc in manual mode: reverses order from frontmatter", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { sortBy: "manual", sortDir: "desc" }
    });
    const links = findLinks(topContainer);
    const topLevelNames = links.slice(0, 3).map(l => l.textContent);

    assertEqual(topLevelNames[0], "Caixa B", "first item reversed");
    assertEqual(topLevelNames[1], "Tarefa 2", "second item reversed");
    assertEqual(topLevelNames[2], "Tarefa 1", "third item reversed");
});

suite.test("sortBy=completed: groups completed tasks at end (asc) with stable manual tie-breaker", async () => {
    // Frontmatter order: Ciclo 1 (inc), Ciclo 10 (comp), Ciclo 2 (comp), Ciclo 9 (inc), Ciclo 20 (inc)
    // Incomplete group: Ciclo 1, Ciclo 9, Ciclo 20 (must maintain manual order!)
    // Completed group: Ciclo 10, Ciclo 2 (must maintain manual order!)
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "sort/Caixa Ciclos.md", inputVal: { sortBy: "completed" }
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);

    // Incomplete items first (completed=false)
    assertEqual(names[0], "Ciclo 1", "Incomplete 1");
    assertEqual(names[1], "Ciclo 9", "Incomplete 2");
    assertEqual(names[2], "Ciclo 20", "Incomplete 3");

    // Completed items next (completed=true)
    assertEqual(names[3], "Ciclo 10", "Completed 1 (preserves relative manual order)");
    assertEqual(names[4], "Ciclo 2", "Completed 2 (preserves relative manual order)");
});

suite.test("sortBy=completed with theBox: maintains natural alphanumeric tie-breaker within groups", async () => {
    // Capítulo 1 (inc), Capítulo 2 (inc), Capítulo 10 (comp), Capítulo 20 (comp)
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "sort/Caixa Alfanumerica TheBox.md", inputVal: { sortBy: "completed" }
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);

    // Incomplete group sorted by natural name:
    assertEqual(names[0], "Capítulo 1", "Incomplete naturally sorted 1");
    assertEqual(names[1], "Capítulo 2", "Incomplete naturally sorted 2");

    // Completed group sorted by natural name:
    assertEqual(names[2], "Capítulo 10", "Completed naturally sorted 1");
    assertEqual(names[3], "Capítulo 20", "Completed naturally sorted 2");
});

suite.test("sortBy=name: tasks sorted alphabetically", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { sortBy: "name" }
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);
    assert(names.indexOf("Caixa B") < names.indexOf("Tarefa 1"),
        `Expected "Caixa B" before "Tarefa 1", got: ${names}`);
});

module.exports = suite;
