/**
 * Test Runner and Assertion Framework for autoTask tests.
 */

const path = require("path");
const fs = require("fs");
const { createElMock } = require("./dom-mock");

const VIEW_JS_PATH = path.resolve(__dirname, "../../view.js");
const viewCode = fs.readFileSync(VIEW_JS_PATH, "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function assertEqual(actual, expected, label = "Value") {
    if (actual !== expected) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertIncludes(actual, expectedSub, label = "Value") {
    if (!String(actual).includes(expectedSub)) {
        throw new Error(`${label}: expected "${actual}" to include "${expectedSub}"`);
    }
}

function assertDeepEqual(actual, expected, label = "Value") {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw new Error(`${label}: expected deep equal\nExpected: ${b}\nActual:   ${a}`);
    }
}

/**
 * Execute autoTask view with isolated mock environment.
 */
async function runScenario({ pages, currentName, inputVal, containerEl, windowMock }) {
    // Deep-clone pages so each run is isolated
    const clonedPages = JSON.parse(JSON.stringify(pages));

    const currentPg = clonedPages.find(
        p => p.file.name === currentName || p.file.path === currentName ||
             p.file.path.endsWith("/" + currentName + ".md") ||
             p.file.path.endsWith("/" + currentName)
    );
    if (!currentPg) {
        throw new Error(`Page "${currentName}" not found in test fixtures.`);
    }

    const rendered = [];
    const topContainer = containerEl || createElMock("div");
    topContainer.isConnected = true;
    const frontMatterWrites = [];

    const dv = {
        current: () => currentPg,
        container: topContainer,
        page: (p) => clonedPages.find(
            x => x.file.path === p || x.file.name === p ||
                 x.file.path.endsWith("/" + p + ".md") || x.file.path.endsWith("/" + p) ||
                 x.file.name === p
        ),
        pages: () => Object.assign([...clonedPages], {
            where: (fn) => Object.assign(clonedPages.filter(fn), {
                array: () => clonedPages.filter(fn)
            })
        }),
        el: (t, text, opts) => {
            const el = createElMock(t, opts);
            if (text !== undefined) el.textContent = String(text);
            rendered.push({ type: "el", tag: t, text: String(text || ""), el });
            topContainer.children.push(el);
            return el;
        },
        paragraph: (t) => {
            const el = createElMock("p");
            el.textContent = String(t);
            rendered.push({ type: "paragraph", text: String(t), el });
            topContainer.children.push(el);
            return el;
        }
    };

    const app = {
        vault: {
            getAbstractFileByPath: (p) => {
                const pg = clonedPages.find(x => x.file.path === p);
                return pg ? { path: pg.file.path } : {};
            },
            read: async (f) => {
                const pg = clonedPages.find(x => x.file.path === (f.path || f));
                return pg ? pg._content : "";
            }
        },
        fileManager: {
            processFrontMatter: async (file, callback) => {
                const pg = clonedPages.find(x => x.file.path === (file.path || file));
                if (!pg) return;
                const fm = {
                    completed: pg.completed,
                    done: pg.done,
                    totalTime: pg.totalTime,
                };
                callback(fm);
                pg.completed = fm.completed;
                pg.done = fm.done;
                if (fm.totalTime !== undefined) pg.totalTime = fm.totalTime;
                frontMatterWrites.push({ path: pg.file.path, ...fm });
            }
        },
        metadataCache: {
            getFirstLinkpathDest: (linkpath) => {
                const found = clonedPages.find(
                    x => x.file.name === linkpath || x.file.path === linkpath ||
                         x.file.path.endsWith("/" + linkpath + ".md") ||
                         x.file.path.endsWith("/" + linkpath)
                );
                return found ? { path: found.file.path, name: found.file.name, basename: found.file.name } : null;
            }
        }
    };

    const win = windowMock || {};
    const fn = new Function("dv", "app", "window", "input", `return (async () => {\n${viewCode}\n})();`);
    await fn(dv, app, win, inputVal);

    const viewKey = topContainer.__autoTaskId;

    return {
        rendered,
        topContainer,
        frontMatterWrites,
        clonedPages,
        windowMock: win,
        viewKey
    };
}

/**
 * Creates a modular test suite.
 */
function createSuite(title) {
    const tests = [];

    function test(name, fn) {
        tests.push({ name, fn });
    }

    async function run() {
        console.log(`\n\x1b[1m\x1b[36m── ${title} ──\x1b[0m`);
        let suitePassed = 0;
        let suiteFailed = 0;
        const failures = [];

        for (const t of tests) {
            try {
                await t.fn();
                console.log(` \x1b[32m✔\x1b[0m ${t.name}`);
                suitePassed++;
            } catch (err) {
                console.error(` \x1b[31m✖\x1b[0m ${t.name}`);
                console.error(`    \x1b[31m-> ${err.message}\x1b[0m`);
                failures.push({ name: t.name, error: err });
                suiteFailed++;
            }
        }

        return { passed: suitePassed, failed: suiteFailed, failures };
    }

    return { test, run, title };
}

module.exports = {
    assert,
    assertEqual,
    assertIncludes,
    assertDeepEqual,
    runScenario,
    createSuite,
    viewCode
};
