const { createSuite, runScenario, assert } = require("../helpers/runner");
const { findBars, findLinks } = require("../helpers/dom-mock");
const { createTestPages } = require("../fixtures/vault");

const suite = createSuite("Template System");

suite.test("template Curso: bar uses 'Aulas' label", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Curso" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Aulas")),
        `Expected "Aulas" in bar, found: ${bars}`);
});

suite.test("template Curso: direct bar uses 'Módulos' label", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Curso" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Módulos")),
        `Expected "Módulos" in bar, found: ${bars}`);
});

suite.test("template Projeto: bar uses 'Tarefas' label", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Projeto" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Tarefas")),
        `Expected "Tarefas" in bar, found: ${bars}`);
});

suite.test("template Livro: bar uses 'Capítulos' label", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Livro" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Capítulos")),
        `Expected "Capítulos" in bar, found: ${bars}`);
});

suite.test("template Treino: bar uses 'Treinos' label", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Treino" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Treinos")),
        `Expected "Treinos" in bar, found: ${bars}`);
});

suite.test("template with custom barraTotal/barraFilhas", async () => {
    const pages = createTestPages();
    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A",
        inputVal: { recursivo: "True", barraTotal: ["Lições", "Feitas"], barraFilhas: ["Séries", "Práticas"] }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Lições") && b.includes("Feitas")),
        `Expected "Lições...Feitas" in bar, found: ${bars}`);
    assert(bars.some(b => b.includes("Séries") && b.includes("Práticas")),
        `Expected "Séries...Práticas" in bar, found: ${bars}`);
});

suite.test("template default.md: applies global default properties", async () => {
    const pages = createTestPages();
    const defaultPage = pages.find(p => p.file.name === "default");
    assert(defaultPage, "default.md template note should exist in fixtures");
    defaultPage.sortBy = "name";

    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: undefined
    });
    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);
    assert(names.indexOf("Caixa B") < names.indexOf("Tarefa 1"),
        `Expected "Caixa B" before "Tarefa 1" due to default.md sortBy: name, got: ${names}`);
});

suite.test("template default.md: combines with chosen template (e.g. curso inherits sortBy from default)", async () => {
    const pages = createTestPages();
    const defaultPage = pages.find(p => p.file.name === "default");
    defaultPage.sortBy = "name";

    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "Curso" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Aulas")), "Should have 'Aulas' from curso template");

    const links = findLinks(topContainer);
    const names = links.map(l => l.textContent);
    assert(names.indexOf("Caixa B") < names.indexOf("Tarefa 1"),
        `Expected "Caixa B" before "Tarefa 1" inherited from default.md, got: ${names}`);
});

suite.test("dynamic template: tracks and loads any new template in templates/ folder", async () => {
    const pages = createTestPages();
    pages.push({
        file: { path: "templates/podcast.md", name: "podcast" },
        recursivo: true,
        barraTotal: "Episódios",
        barraFilhas: ["Temporadas", "Ouvidas"],
        theBox: null, order: null, completed: null, done: null, totalTime: null
    });

    const { topContainer } = await runScenario({
        pages, currentName: "Caixa A", inputVal: { template: "podcast" }
    });
    const bars = findBars(topContainer);
    assert(bars.some(b => b.includes("Episódios")),
        `Expected 'Episódios' from new podcast template, found: ${bars}`);
    assert(bars.some(b => b.includes("Temporadas") && b.includes("Ouvidas")),
        `Expected 'Temporadas...Ouvidas' from new podcast template, found: ${bars}`);
});

module.exports = suite;
