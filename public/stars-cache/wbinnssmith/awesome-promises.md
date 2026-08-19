<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo" align="right" />
</a>

# Awesome Promises [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)

> A curated list of useful resources for JavaScript Promises

Inspired by the ⭐️ 436,538 [awesome](https://github.com/sindresorhus/awesome) list thing. Not to be confused with other awesome promises like "I promise you a million dollars" or "I promise you'll stay fit and never have to go to the gym again".

**Table of Contents**

- [Resources, Blogs, and Books](#resources-blogs-and-books)
- [Promises/A+ Implementations (ES6/ES2015 compatible)](#promisesa-implementations-es6es2015-compatible)
  - [Strict Implementations](#strict-implementations)
  - [Implementations with extras](#implementations-with-extras)
  - [Fallbacks](#fallbacks)
- [Convenience Utilities](#convenience-utilities)

## Resources, Blogs, and Books

### For beginners
* ⭐️ 1,616 [Promise Cookbook](https://github.com/mattdesl/promise-cookbook) - The why, what, and how. "A brief introduction [...] primarily aimed at frontend developers".
* [Promises for Asynchronous Programming](http://exploringjs.com/es6/ch_promises.html) - Chapter from [Exploring ES6](http://exploringjs.com/)
* ⭐️ 184,395 [You Don't Know JS: Promises](https://github.com/getify/You-Dont-Know-JS) - Chapter from [You Don't Know JS: Async & Performance](https://github.com/getify/You-Dont-Know-JS/tree/master/async%20%26%20performance)
* [JavaScript Promises: an Introduction](https://developers.google.com/web/fundamentals/getting-started/primers/promises) - Basics of JavaScript's native promise implementation.
* [JavaScript with Promises](http://shop.oreilly.com/product/0636920032151.do) - from O'Reilly. Short and to-the-point. Uses native and bluebird.
* ⭐️ 738 [Promise it won't hurt](https://github.com/stevekane/promise-it-wont-hurt) - An interactive [nodeschool](https://nodeschool.io/) workshop
* [ES6 Kata Promises](http://es6katas.org/) - Promises Katas : [Basics](http://tddbin.com/#?kata=es6/language/promise/basics)
* [ES6 Promises in Depth](https://ponyfoo.com/articles/es6-promises-in-depth)
* [An Incremental Tutorial on Promises](http://www.sohamkamani.com/blog/2016/08/28/incremenal-tutorial-to-promises/) - An FAQ styled tutorial for beginners.

### Deep Dive
* ⭐️ 5,120 [Promise Fun](https://github.com/sindresorhus/promise-fun) - @sindresorhus's notes, patterns, and solutions to common Promise problems
* [You're Missing the Point of Promises](https://blog.domenic.me/youre-missing-the-point-of-promises/) - Promises are much more than callback aggregation, and that jQuery's implementation (prior to 3.0) isn't enough.
* [We have a problem with promises](https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html) - "Many of us are using promises without really understanding them."
* ⭐️ 20,808 [Promise anti-patterns](https://github.com/petkaantonov/bluebird) - Common misuses and how to avoid them.
* [Promise anti-patterns (2)](http://taoofcode.net/promise-anti-patterns/) - Another set of promises anti-patterns
* [Promise Ponderings, (Anti-)Patterns, and Apologies](https://sdgluck.github.io/2015/08/24/promise-ponderings-patterns-apologies/) - Promise behaviour demonstrated and explained by common questions and their answers.
* [Javascript Promises...In Wicked Detail](http://www.mattgreer.org/articles/promises-in-wicked-detail/) - Recreate the promise implementation
* [Writing Promise-Using Specifications](https://www.w3.org/2001/tag/doc/promises-guide) - "This document gives guidance on how to write specifications that create, accept, or manipulate promises"
* [Async functions - making promises friendly](https://developers.google.com/web/fundamentals/getting-started/primers/async-functions)

### References
* [Promises/A+ specification](https://promisesaplus.com/)
* [caniuse promises](http://caniuse.com/#feat=promises)
* ⭐️ 1,258 [Fates and States](https://github.com/domenic/promises-unwrapping) - Quick definitions of possible states.
* [Promisees](https://bevacqua.github.io/promisees/) - Promise visualization playground for the adventurous.

## Promises/A+ Implementations (ES6/ES2015 compatible)

### Strict Implementations
These implement no more or less than the es6 spec. They make great polyfills and are exceptionally compatible with native promises.

* ⭐️ 138 [pinkie](https://github.com/floatdrop/pinkie) - Ponyfill. Node-oriented, but [browserifyable](https://github.com/substack/node-browserify). *Extremely* small implementation.
* ⭐️ 717 [native-promise-only](https://github.com/getify/native-promise-only) - Polyfill. Browser and node-compatible.
* ⭐️ 7,288 [es6-promise](https://github.com/stefanpenner/es6-promise) - Opt-in polyfill. A strict-spec subset of rsvp.js.
* ⭐️ 741 [lie](https://github.com/calvinmetcalf/lie) - Small, browserifyable with an opt-in polyfill.

### Implementations with extras
All of these provide more features than the language yet remain compatible. Node + Browsers for all.

* ⭐️ 20,808 [bluebird](https://github.com/petkaantonov/bluebird) - Fully featured, extremely performant. Long stack traces & generator/coroutine support.
* ⭐️ 278 [creed](https://github.com/briancavalier/creed) - Hyper performant & full featured like Bluebird, but FP-oriented. Coroutines, generators, promises, ES2015 iterables, & fantasy-land spec.
* ⭐️ 3,602 [rsvp.js](https://github.com/tildeio/rsvp.js) - Lightweight with a few extras. Compatible down to IE6!
* ⭐️ 15,276 [Q](https://github.com/kriskowal/q) - One of the original implementations. Long stack traces and other goodies.
* ⭐️ 2,593 [then/promise](https://github.com/then/promise) - Small with `nodeify`, `denodify` and `done()` additions.
* ⭐️ 3,433 [when.js](https://github.com/cujojs/when) - Packed with control flow, functional, and utility methods.


### Fallbacks
* [native-or-bluebird](https://www.npmjs.com/package/native-or-bluebird) - Helps transition to completely native.
* ⭐️ 116 [pinkie-promise](https://github.com/floatdrop/pinkie-promise) - Use native, or fall back to `pinkie`. Great for node library authors.
* ⭐️ 181 [any-promise](https://github.com/kevinbeaty/any-promise) - Loads the first available implementation. Safe for browserify.

## Convenience Utilities
Native and strictly spec-compliant promises are awesome for compatibility, future-proofness, library authors, and browsers. However, libraries like bluebird patch goodies onto the `Promise` constructor and prototype. Solution? tiny modules of course!

### sindresorhus's many Promise utilities (⭐️ 5,120 [see notes](https://github.com/sindresorhus/promise-fun))
* ⭐️ 627 [delay](https://github.com/sindresorhus/delay) - Delay a promise a specified amount of time.
* ⭐️ 1,514 [pify](https://github.com/sindresorhus/pify) - Promisify ("denodify") a callback-style function.
* ⭐️ 282 [loud-rejection](https://github.com/sindresorhus/loud-rejection) - Make unhandled promise rejections fail loudly instead of the default silent fail.
* ⭐️ 107 [hard-rejection](https://github.com/sindresorhus/hard-rejection) - Make unhandled promise rejections fail hard right away instead of the default silent fail
* ⭐️ 4,117 [p-queue](https://github.com/sindresorhus/p-queue) - Promise queue with concurrency control
* ⭐️ 24 [p-break](https://github.com/sindresorhus/p-break) - Break out of a promise chain
* ⭐️ 285 [p-lazy](https://github.com/sindresorhus/p-lazy) - Create a lazy promise that defers execution until `.then()` or `.catch()` is called
* ⭐️ 84 [p-defer](https://github.com/sindresorhus/p-defer) - Create a deferred promise
* ⭐️ 63 [p-if](https://github.com/sindresorhus/p-if) - Conditional promise chains
* ⭐️ 134 [p-tap](https://github.com/sindresorhus/p-tap) - Tap into a promise chain without affecting its value or state
* ⭐️ 1,481 [p-map](https://github.com/sindresorhus/p-map) - Map over promises concurrently
* ⭐️ 344 [p-all](https://github.com/sindresorhus/p-all) - Run promise-returning & async functions concurrently with optional limited concurrency
* ⭐️ 2,784 [p-limit](https://github.com/sindresorhus/p-limit) - Run multiple promise-returning & async functions with limited concurrency
* ⭐️ 41 [p-times](https://github.com/sindresorhus/p-times) - Run promise-returning & async functions a specific number of times concurrently
* ⭐️ 40 [p-catch-if](https://github.com/sindresorhus/p-catch-if) - Conditional promise catch handler
* ⭐️ 72 [p-time](https://github.com/sindresorhus/p-time) - Measure the time a promise takes to resolve
* ⭐️ 29 [p-log](https://github.com/sindresorhus/p-log) - Log the value/error of a promise
* ⭐️ 80 [p-filter](https://github.com/sindresorhus/p-filter) - Filter promises concurrently
* ⭐️ 94 [p-settle](https://github.com/sindresorhus/p-settle) - Settle promises concurrently and get their fulfillment value or rejection reason
* ⭐️ 437 [p-memoize](https://github.com/sindresorhus/p-memoize) - Memoize promise-returning & async functions
* ⭐️ 58 [p-whilst](https://github.com/sindresorhus/p-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise
* ⭐️ 509 [p-throttle](https://github.com/sindresorhus/p-throttle) - Throttle promise-returning & async functions
* ⭐️ 233 [p-debounce](https://github.com/sindresorhus/p-debounce) - Debounce promise-returning & async functions
* ⭐️ 985 [p-retry](https://github.com/sindresorhus/p-retry) - Retry a promise-returning or async function
* ⭐️ 166 [p-wait-for](https://github.com/sindresorhus/p-wait-for) - Wait for a condition to be true
* ⭐️ 299 [p-timeout](https://github.com/sindresorhus/p-timeout) - Timeout a promise after a specified amount of time
* ⭐️ 51 [p-race](https://github.com/sindresorhus/p-race) - A better `Promise.race()`
* ⭐️ 60 [p-try](https://github.com/sindresorhus/p-try) - `Promise#try()` ponyfill - Starts a promise chain
* ⭐️ 47 [p-finally](https://github.com/sindresorhus/p-finally) - `Promise#finally()` ponyfill - Invoked when the promise is settled regardless of outcome
* ⭐️ 56 [p-any](https://github.com/sindresorhus/p-any) - Wait for any promise to be fulfilled
* ⭐️ 39 [p-some](https://github.com/sindresorhus/p-some) - Wait for a specified number of promises to be fulfilled
* ⭐️ 126 [p-pipe](https://github.com/sindresorhus/p-pipe) - Compose promise-returning & async functions into a reusable pipeline
* ⭐️ 52 [p-each-series](https://github.com/sindresorhus/p-each-series) - Iterate over promises serially
* ⭐️ 50 [p-map-series](https://github.com/sindresorhus/p-map-series) - Map over promises serially
* ⭐️ 74 [p-reduce](https://github.com/sindresorhus/p-reduce) - Reduce a list of values using promises into a promise for a value
* ⭐️ 200 [p-props](https://github.com/sindresorhus/p-props) - Like `Promise.all()` but for `Map` and `Object`

### Others
* ⭐️ 2 [promise-method](https://github.com/wbinnssmith/promise-method) - Standalone `bluebird.method`. Turn a synchronously-returning method into a promise-returning one.
* ⭐️ 282 [is-promise](https://github.com/then/is-promise) - Determine if something looks like a Promise.
* ⭐️ 14 [sprom](https://github.com/then/sprom) - Resolve when a stream ends. Optional buffering (be careful with this!)
* ⭐️ 1,629 [task.js](https://github.com/mozilla/task.js) - Write async functions in a blocking style using promises and generators. Like `bluebird.coroutine`.
* ⭐️ 11,878 [co](https://github.com/tj/co) - Like `task.js` and `bluebird.coroutine`, but supports thunks too.
* [lie-fs](https://www.npmjs.com/package/lie-fs) - Promise wrappers for Node's FS API.
* ⭐️ 1 [promise-do-until](https://github.com/busterc/promise-do-until) - Calls a function repeatedly until a condition returns true and then resolves the promise.
* ⭐️ 3 [promise-do-whilst](https://github.com/busterc/promise-do-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise.
* ⭐️ 28 [promise-semaphore](https://github.com/samccone/promise-semaphore) - Push a set of work to be done in a configurable serial fashion
* ⭐️ 2 [promise-nodeify](https://github.com/kevinoid/promise-nodeify) - Standalone `nodeify` method which calls a Node-style callback on resolution or rejection.

## License
Licensed under the [Creative Commons CC0 License](https://creativecommons.org/publicdomain/zero/1.0/).
