/**
 * In-memory vault fixtures for autoTask unit tests.
 * Completely decoupled from the examples/ directory so user edits in Obsidian
 * never interfere with automated tests.
 */

function createTestPages() {
    return [
        // ── Recursive hierarchy ──
        // Structure:
        // Caixa A
        //   ├── Tarefa 1 (completed: true, 2026-09-24)
        //   ├── Tarefa 2 (completed: false, time: 120min)
        //   └── Caixa B (totalTime: 37 stale)
        //         ├── Tarefa 3 (completed: false)
        //         └── Caixa C (completed: true, 2026-09-29)
        //               ├── Tarefa 4 (completed: true, 2026-09-25, time: 37min)
        //               └── Tarefa 5 (completed: true, 2026-09-24)
        {
            file: { path: "recursive/Caixa A.md", name: "Caixa A" },
            order: [
                { path: "Tarefa 1" },
                { path: "Tarefa 2" },
                { path: "Caixa B" }
            ],
            theBox: null,
            totalTime: 157,
            completed: false,
            done: null,
            _content: `---\norder:\n  - "[[Tarefa 1]]"\n  - "[[Tarefa 2]]"\n  - "[[Caixa B]]"\ntotalTime: 157\ncompleted: false\ndone:\n---\n`
        },
        {
            file: { path: "recursive/Caixa B.md", name: "Caixa B" },
            order: [
                { path: "Tarefa 3" },
                { path: "Caixa C" }
            ],
            theBox: null,
            totalTime: 37,
            completed: null,
            done: null,
            _content: `---\norder:\n  - "[[Tarefa 3]]"\n  - "[[Caixa C]]"\ntotalTime: 37\n---\n`
        },
        {
            file: { path: "recursive/Caixa C.md", name: "Caixa C" },
            order: [
                { path: "Tarefa 4" },
                { path: "Tarefa 5" }
            ],
            theBox: null,
            totalTime: 37,
            completed: true,
            done: "2026-09-29",
            _content: `---\norder:\n  - "[[Tarefa 4]]"\n  - "[[Tarefa 5]]"\ntotalTime: 37\ncompleted: true\ndone: 2026-09-29\n---\n`
        },
        {
            file: { path: "recursive/Tarefa 1.md", name: "Tarefa 1" },
            order: null,
            theBox: null,
            completed: true,
            done: "2026-09-24",
            totalTime: null,
            _content: `---\ncompleted: true\ndone: 2026-09-24\n---\n`
        },
        {
            file: { path: "recursive/Tarefa 2.md", name: "Tarefa 2" },
            order: null,
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\ncompleted: false\ndone:\n---\n\`\`\`simple-time-tracker\n{"entries":[{"name":"Segment 1","startTime":"2026-09-24T19:37:07.000Z","endTime":"2026-09-24T21:37:07.000Z"}]}\n\`\`\`\n`
        },
        {
            file: { path: "recursive/Tarefa 3.md", name: "Tarefa 3" },
            order: null,
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\ncompleted: false\ndone:\n---\n`
        },
        {
            file: { path: "recursive/Tarefa 4.md", name: "Tarefa 4" },
            order: null,
            theBox: null,
            completed: true,
            done: "2026-09-25",
            totalTime: null,
            _content: `---\ncompleted: true\ndone: 2026-09-25\n---\n\`\`\`simple-time-tracker\n{"entries":[{"name":"Segment 1","startTime":"2026-09-24T19:00:53.000Z","endTime":"2026-09-24T19:37:54.000Z"}]}\n\`\`\`\n`
        },
        {
            file: { path: "recursive/Tarefa 5.md", name: "Tarefa 5" },
            order: null,
            theBox: null,
            completed: true,
            done: "2026-09-24",
            totalTime: null,
            _content: `---\ncompleted: true\ndone: 2026-09-24\n---\n`
        },

        // ── Ghost notes ──
        {
            file: { path: "ghost/a) notas fantasmas.md", name: "a) notas fantasmas" },
            order: [
                { path: "fantasma 1" },
                { path: "fantasma 2" },
                { path: "fantasmão 3", display: "fantasma 3" }
            ],
            theBox: null,
            totalTime: 30,
            completed: null,
            done: null,
            _content: `---\norder:\n  - "[[fantasma 1]]"\n  - "[[fantasma 2]]"\n  - "[[fantasmão 3|fantasma 3]]"\ntotalTime: 30\n---\n`
        },
        {
            file: { path: "ghost/fantasma 1.md", name: "fantasma 1" },
            order: null,
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\ncompleted: false\ndone:\n---\n\`\`\`simple-time-tracker\n{"entries":[{"name":"Segment 1","startTime":"2026-09-25T18:02:33.000Z","endTime":"2026-09-25T18:32:34.000Z"}]}\n\`\`\`\n`
        },
        // Note: fantasma 2 and fantasmão 3 intentionally omitted to test ghost resolution

        // ── TheBox reverse indexing ──
        {
            file: { path: "total/Caixa A.md", name: "Caixa A" },
            order: null,
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: ""
        },
        {
            file: { path: "total/Caixa B (theBox; Caixa A).md", name: "Caixa B" },
            order: null,
            theBox: [
                { path: "total/Caixa A" },
                { path: "scripts/autoTask/tests/total/Caixa A" },
                { path: "Caixa A" }
            ],
            completed: true,
            done: "2026-09-29",
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa A]]"\ncompleted: true\ndone: 2026-09-29\n---\n`
        },
        {
            file: { path: "total/Tarefa 1 (completed; true).md", name: "Tarefa 1" },
            order: null,
            theBox: [
                { path: "total/Caixa A" },
                { path: "scripts/autoTask/tests/total/Caixa A" },
                { path: "Caixa A" }
            ],
            completed: true,
            done: "2026-09-24",
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa A]]"\ncompleted: true\ndone: 2026-09-24\n---\n`
        },
        {
            file: { path: "total/Tarefa 2 (completed; false).md", name: "Tarefa 2" },
            order: null,
            theBox: [
                { path: "total/Caixa A" },
                { path: "scripts/autoTask/tests/total/Caixa A" },
                { path: "Caixa A" }
            ],
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa A]]"\ncompleted: false\n---\n`
        },
        {
            file: { path: "total/Tarefa 3 (completed; true).md", name: "Tarefa 3" },
            order: null,
            theBox: [{ path: "Caixa B (theBox; Caixa A)" }, { path: "Caixa B" }],
            completed: true,
            done: "2026-09-24",
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa B (theBox; Caixa A)]]"\ncompleted: true\n---\n`
        },
        {
            file: { path: "total/Tarefa 4 (completed; true).md", name: "Tarefa 4" },
            order: null,
            theBox: [{ path: "Caixa B (theBox; Caixa A)" }, { path: "Caixa B" }],
            completed: true,
            done: "2026-09-24",
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa B (theBox; Caixa A)]]"\ncompleted: true\n---\n`
        },
        {
            file: { path: "total/Tarefa 5 (completed; false).md", name: "Tarefa 5" },
            order: null,
            theBox: [{ path: "Caixa B (theBox; Caixa A)" }, { path: "Caixa B" }],
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa B (theBox; Caixa A)]]"\ncompleted: false\n---\n`
        },

        // ── Natural / Alphanumeric Sorting Fixtures ──
        {
            file: { path: "sort/Caixa Ciclos.md", name: "Caixa Ciclos" },
            order: [
                { path: "Ciclo 1" },
                { path: "Ciclo 10" },
                { path: "Ciclo 2" },
                { path: "Ciclo 9" },
                { path: "Ciclo 20" }
            ],
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: `---\norder:\n  - "[[Ciclo 1]]"\n  - "[[Ciclo 10]]"\n  - "[[Ciclo 2]]"\n  - "[[Ciclo 9]]"\n  - "[[Ciclo 20]]"\n---\n`
        },
        {
            file: { path: "sort/Ciclo 1.md", name: "Ciclo 1" },
            completed: false,
            done: null,
            order: null,
            theBox: null,
            totalTime: null,
            _content: `---\ncompleted: false\n---\n`
        },
        {
            file: { path: "sort/Ciclo 2.md", name: "Ciclo 2" },
            completed: true,
            done: "2026-09-20",
            order: null,
            theBox: null,
            totalTime: null,
            _content: `---\ncompleted: true\ndone: 2026-09-20\n---\n`
        },
        {
            file: { path: "sort/Ciclo 9.md", name: "Ciclo 9" },
            completed: false,
            done: null,
            order: null,
            theBox: null,
            totalTime: null,
            _content: `---\ncompleted: false\n---\n`
        },
        {
            file: { path: "sort/Ciclo 10.md", name: "Ciclo 10" },
            completed: true,
            done: "2026-09-21",
            order: null,
            theBox: null,
            totalTime: null,
            _content: `---\ncompleted: true\ndone: 2026-09-21\n---\n`
        },
        {
            file: { path: "sort/Ciclo 20.md", name: "Ciclo 20" },
            completed: false,
            done: null,
            order: null,
            theBox: null,
            totalTime: null,
            _content: `---\ncompleted: false\n---\n`
        },

        // Reverse index natural sorting fixture (theBox)
        {
            file: { path: "sort/Caixa Alfanumerica TheBox.md", name: "Caixa Alfanumerica TheBox" },
            order: null,
            theBox: null,
            completed: false,
            done: null,
            totalTime: null,
            _content: ""
        },
        {
            file: { path: "sort/Capítulo 10.md", name: "Capítulo 10" },
            theBox: [{ path: "Caixa Alfanumerica TheBox" }],
            completed: true,
            done: "2026-09-21",
            order: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa Alfanumerica TheBox]]"\ncompleted: true\n---\n`
        },
        {
            file: { path: "sort/Capítulo 2.md", name: "Capítulo 2" },
            theBox: [{ path: "Caixa Alfanumerica TheBox" }],
            completed: false,
            done: null,
            order: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa Alfanumerica TheBox]]"\ncompleted: false\n---\n`
        },
        {
            file: { path: "sort/Capítulo 1.md", name: "Capítulo 1" },
            theBox: [{ path: "Caixa Alfanumerica TheBox" }],
            completed: false,
            done: null,
            order: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa Alfanumerica TheBox]]"\ncompleted: false\n---\n`
        },
        {
            file: { path: "sort/Capítulo 20.md", name: "Capítulo 20" },
            theBox: [{ path: "Caixa Alfanumerica TheBox" }],
            completed: true,
            done: "2026-09-22",
            order: null,
            totalTime: null,
            _content: `---\ntheBox:\n  - "[[Caixa Alfanumerica TheBox]]"\ncompleted: true\n---\n`
        },

        // ── Template pages ──
        {
            file: { path: "templates/default.md", name: "default" },
            sortBy: "manual",
            sortDir: "asc",
            recursivo: false,
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nsortBy: manual\nsortDir: asc\nrecursivo: false\n---\n`
        },
        {
            file: { path: "templates/curso.md", name: "curso" },
            recursivo: true,
            barraTotal: "Aulas",
            barraFilhas: ["Módulos", "Feitos"],
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nrecursivo: true\nbarraTotal: Aulas\nbarraFilhas:\n  - Módulos\n  - Feitos\n---\n`
        },
        {
            file: { path: "templates/projeto.md", name: "projeto" },
            barraTotal: "Tarefas",
            barraFilhas: ["Etapas", "Concluídas"],
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nbarraTotal: Tarefas\nbarraFilhas:\n  - Etapas\n  - Concluídas\n---\n`
        },
        {
            file: { path: "templates/livro.md", name: "livro" },
            barraTotal: "Capítulos",
            barraFilhas: ["Partes", "Lidas"],
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nbarraTotal: Capítulos\nbarraFilhas:\n  - Partes\n  - Lidas\n---\n`
        },
        {
            file: { path: "templates/treino.md", name: "treino" },
            barraTotal: "Treinos",
            barraFilhas: ["Séries", "Feitas"],
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nbarraTotal: Treinos\nbarraFilhas:\n  - Séries\n  - Feitas\n---\n`
        },
        {
            file: { path: "templates/outlierEnglish.md", name: "outlierEnglish" },
            barraTotal: "Aulas",
            barraFilhas: ["Ciclos", "Concluídos"],
            theBox: null,
            order: null,
            completed: null,
            done: null,
            totalTime: null,
            _content: `---\nbarraTotal: Aulas\nbarraFilhas:\n  - Ciclos\n  - Concluídos\n---\n`
        }
    ];
}

module.exports = {
    createTestPages
};
