/**
 * DOM Mock for autoTask unit tests.
 * Simulates Obsidian / Dataview DOM elements and events in Node.js.
 */

function createElMock(tag, opts = {}) {
    const el = {
        tagName: tag.toUpperCase(),
        style: {},
        textContent: "",
        children: [],
        _attrs: opts.attr ? { ...opts.attr } : {},
        _cls: opts.cls || null,
        _type: opts.type || null,
        _href: opts.href || null,
        checked: false,
        disabled: false,
        isConnected: false,
        _parent: null,
        _listeners: {},

        createEl(t, o) {
            const child = createElMock(t, o);
            child._parent = el;
            if (el.isConnected) child.isConnected = true;
            el.children.push(child);
            if (o) {
                if (o.text !== undefined) child.textContent = String(o.text);
                if (o.type) child._type = o.type;
                if (o.cls) child._cls = o.cls;
                if (o.href) child._href = o.href;
                if (o.attr) Object.assign(child._attrs, o.attr);
            }
            return child;
        },

        setText(t) {
            el.textContent = String(t);
        },

        appendChild(child) {
            child._parent = el;
            if (el.isConnected) {
                child.isConnected = true;
                for (const desc of findAll(child, () => true)) {
                    desc.isConnected = true;
                }
            }
            el.children.push(child);
            return child;
        },

        addEventListener(evt, fn) {
            if (!el._listeners[evt]) el._listeners[evt] = [];
            el._listeners[evt].push(fn);
        },

        remove() {
            if (el._parent) {
                const idx = el._parent.children.indexOf(el);
                if (idx !== -1) el._parent.children.splice(idx, 1);
                el._parent = null;
            }
            el.isConnected = false;
        }
    };

    if (opts.text !== undefined) el.textContent = String(opts.text);
    if (opts.cls) el._cls = opts.cls;
    if (opts.type) el._type = opts.type;
    if (opts.href) el._href = opts.href;

    return el;
}

/** Recursively find all elements matching a predicate */
function findAll(root, pred) {
    if (!root) return [];
    const result = [];
    if (pred(root)) result.push(root);
    for (const child of (root.children || [])) {
        result.push(...findAll(child, pred));
    }
    return result;
}

/** Fire all listeners of an event type on an element */
async function fireEvent(el, evtName) {
    const fns = el._listeners && el._listeners[evtName];
    if (fns) {
        for (const fn of fns) {
            await fn();
        }
    }
}

/** Get all text content from rendered items */
function getRenderedTexts(rendered) {
    return rendered.map(r => r.text).filter(Boolean);
}

/** Find rendered progress bars */
function findBars(container) {
    const barLabels = [];
    const allDivs = findAll(container, el => el.tagName === "DIV" && el.textContent);
    for (const div of allDivs) {
        const t = div.textContent;
        if (t.includes("/") && t.includes("(") && t.includes("%")) {
            barLabels.push(t);
        }
    }
    return barLabels;
}

/** Find checkboxes */
function findCheckboxes(container) {
    return findAll(container, el => el.tagName === "INPUT" && el._type === "checkbox");
}

/** Find link elements */
function findLinks(container) {
    return findAll(container, el => el.tagName === "A");
}

/** Find badge spans */
function findBadges(container) {
    return findAll(container, el =>
        el.tagName === "SPAN" && /^\d+\/\d+$/.test(el.textContent)
    );
}

/** Find done spans (marked with checkmark and date) */
function findDoneSpans(container) {
    return findAll(container, el =>
        el.tagName === "SPAN" && el.textContent.includes("✅")
    );
}

module.exports = {
    createElMock,
    findAll,
    fireEvent,
    getRenderedTexts,
    findBars,
    findCheckboxes,
    findLinks,
    findBadges,
    findDoneSpans
};
