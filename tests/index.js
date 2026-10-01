#!/usr/bin/env node

/**
 * autoTask Test Suite Master Runner
 *
 * Runs all modular test suites in tests/suites/
 * Completely decoupled from examples/ so user experimentation in Obsidian
 * never breaks test runs.
 *
 * Usage:
 *   node tests/index.js
 *   node test.js
 */

const suite01 = require("./suites/01-recursive.test");
const suite02 = require("./suites/02-non-recursive.test");
const suite03 = require("./suites/03-ghost-notes.test");
const suite04 = require("./suites/04-templates.test");
const suite05 = require("./suites/05-thebox-index.test");
const suite06 = require("./suites/06-checkbox-clicks.test");
const suite07 = require("./suites/07-sync-box-status.test");
const suite08 = require("./suites/08-time-tracking.test");
const suite09 = require("./suites/09-sorting-natural.test");
const suite10 = require("./suites/10-reconciliation-antiflicker.test");
const suite11 = require("./suites/11-memory-and-lifecycle.test");

const suites = [
    suite01,
    suite02,
    suite03,
    suite04,
    suite05,
    suite06,
    suite07,
    suite08,
    suite09,
    suite10,
    suite11
];

async function main() {
    const startTime = Date.now();
    console.log("==================================================");
    console.log("        autoTask Automated Test Suite");
    console.log("==================================================");

    let totalPassed = 0;
    let totalFailed = 0;
    const allFailures = [];

    for (const suite of suites) {
        const { passed, failed, failures } = await suite.run();
        totalPassed += passed;
        totalFailed += failed;
        if (failures.length > 0) {
            allFailures.push(...failures);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n==================================================");
    if (totalFailed === 0) {
        console.log(`\x1b[32m✔ SUCCESS: All ${totalPassed} tests passed in ${duration}s!\x1b[0m`);
    } else {
        console.log(`\x1b[31m✖ FAILURE: ${totalPassed} passed, ${totalFailed} failed in ${duration}s\x1b[0m`);
        console.log("\nFailed tests:");
        allFailures.forEach(f => {
            console.log(`  - ${f.name}: ${f.error.message}`);
        });
    }
    console.log("==================================================\n");

    if (totalFailed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error("Fatal error during test run:", err);
        process.exit(1);
    });
}

module.exports = { main };
