# Persisting React state with localStorage

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

An easy, basic and raw (no styles attached) example of **HOW to** keep React state
across reloads using the Web Storage API. Type messages, reload the page, they are
still there.

| File | Role |
| --- | --- |
| `src/readingLocalStorage.js` | reads and validates what is in storage; never throws |
| `src/useLocalStorage.js` | writes on change, and again when the page is hidden |
| `src/App.js` | the form and the list |

## The interesting part is everything that can go wrong

Writing to localStorage is one line. What makes this worth a repo is that
**localStorage is untrusted input**: the user can edit it, another script on the origin
can write to it, a half-finished write can leave it truncated, and the browser can
refuse to give it to you at all.

The original version was `JSON.parse(localStorage.getItem(KEY))` with no guard. Two
ways that ends badly, both measured against the old code:

| stored value | result |
| --- | --- |
| `{"broken": ` | `SyntaxError: Unexpected end of JSON input` |
| `"a string, not an array"` | parses fine, then `App` calls `.map` on a string |

Both throw during render, so the page goes blank. And because the bad value is *still
in localStorage*, it happens again on every reload: the app is bricked until someone
opens devtools and clears the key. There is no path back through the UI.

So `readingLocalStorage` now returns `[]` on a parse failure **and removes the key**,
rejects anything that is not an array, and filters out entries that are not
`{ id: string, message: string }`. Reading storage at all is wrapped too, because
access throws outright when storage is disabled by policy, and historically did in
Safari's private mode. `src/readingLocalStorage.test.js` covers each of those.

## When to write

The original wrote **only** in a `beforeunload` handler. That loses everything on the
most common mobile exit: iOS Safari does not reliably fire `beforeunload` when the user
switches apps or the OS reclaims the tab.

`useLocalStorage` now saves on every change, and again on `visibilitychange` (when the
page becomes hidden) and `pagehide`. Those are the events browsers actually guarantee.
`setItem` is wrapped as well: a `QuotaExceededError` should cost you persistence, not
take down the app.

## Two React details worth copying

**Lazy state initialisation.** `useState(readingLocalStorage())` calls the reader on
every render and throws the result away after the first, so every keystroke re-read and
re-parsed localStorage. `useState(readingLocalStorage)` passes the function and React
calls it once.

**Functional updates.** `setMessagesState([...messagesState, newOne])` reads the array
from the closure. Two submissions batched together both start from the same array and
the first is lost. `setMessagesState(current => [...current, newOne])` cannot.

## Installation

```shell
npm ci
npm start
npm run lint
npm test
npm run build
```

**On Node 17 or newer `npm run build` fails** with `ERR_OSSL_EVP_UNSUPPORTED`: webpack 4
(via `react-scripts` 3) asking OpenSSL 3 for MD4, not a problem with this code. The
versions here are deliberately frozen, so pass the flag:

```shell
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

CI runs on GitHub Actions. It replaced a `.travis.yml` that deployed to a Heroku free
dyno with an encrypted API key and ran `echo "skipping tests"` in place of the tests.
