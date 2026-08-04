/**
 * ==========================================================
 * RESUVIX AI
 * Utility Functions
 * ==========================================================
 */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    document.querySelectorAll(selector);

/**
 * Create Element
 */

function createElement(tag, className = "") {

    const element =
        document.createElement(tag);

    if (className)
        element.className = className;

    return element;

}

/**
 * Delay
 */

function sleep(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}

/**
 * Debounce
 */

function debounce(callback, delay = 300) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}

/**
 * Capitalize
 */

function capitalize(text) {

    return text
        .charAt(0)
        .toUpperCase() +

        text.slice(1);

}

/**
 * Generate UUID
 */

function uuid() {

    return crypto.randomUUID();

}