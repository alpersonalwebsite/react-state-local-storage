import { LS_MESSAGES_KEY } from './constants'

// Reads the saved messages, and never throws.
//
// The previous version was a bare JSON.parse(localStorage.getItem(KEY)) with no guard,
// which fails in two ways that both take the whole app down:
//
//   corrupt value    '{"broken": '            -> SyntaxError: Unexpected end of JSON input
//   valid but wrong  '"a string, not array"'  -> returned as-is, then App calls .map on it
//
// Both are thrown during render, so the user gets a blank page, and because the bad
// value is still sitting in localStorage it happens again on every reload. There is no
// way out of that from the UI: you need devtools. For a demo about persisting state in
// localStorage, that is the failure worth handling.
//
// localStorage itself can also throw on access: Safari in private mode historically
// did, and any browser does when storage is disabled by policy.
const readingLocalStorage = () => {
  let raw

  try {
    raw = localStorage.getItem(LS_MESSAGES_KEY)
  } catch (err) {
    // Storage unavailable entirely. The app still works, it just will not persist.
    return []
  }

  if (!raw) return []

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    // Corrupt. Drop it rather than leaving a value that breaks every future load.
    try {
      localStorage.removeItem(LS_MESSAGES_KEY)
    } catch (removeErr) {
      // nothing further to do
    }
    return []
  }

  // Parsing succeeding is not the same as the value being usable. Anything that is not
  // an array of {id, message} would blow up in the render, so it is filtered here
  // instead, at the boundary where the untrusted value enters the app.
  if (!Array.isArray(parsed)) return []

  return parsed.filter(
    item => item && typeof item.id === 'string' && typeof item.message === 'string'
  )
}

export default readingLocalStorage
