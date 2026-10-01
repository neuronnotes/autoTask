#!/usr/bin/env node

/**
 * autoTask Test Runner Entrypoint
 *
 * Forwards execution to the modular test suite under tests/.
 * Completely decoupled from examples/ so user testing in Obsidian never breaks automated tests.
 *
 * Run:
 *   node test.js
 *   node tests/index.js
 */

const { main } = require("./tests/index");

main().catch(err => {
    console.error("Fatal error during test run:", err);
    process.exit(1);
});
