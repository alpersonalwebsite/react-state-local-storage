import readingLocalStorage from './readingLocalStorage'
import { LS_MESSAGES_KEY } from './constants'

beforeEach(() => localStorage.clear())

it('returns an empty list when nothing is stored', () => {
  expect(readingLocalStorage()).toEqual([])
})

it('returns the stored messages', () => {
  const messages = [{ id: 'a', message: 'hello' }]
  localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(messages))
  expect(readingLocalStorage()).toEqual(messages)
})

// The regression this file exists for: a corrupt value used to throw during render, and
// because it stayed in localStorage it took the app down on every subsequent load too.
it('survives a corrupt value, and clears it so the next load is clean', () => {
  localStorage.setItem(LS_MESSAGES_KEY, '{"broken": ')
  expect(readingLocalStorage()).toEqual([])
  expect(localStorage.getItem(LS_MESSAGES_KEY)).toBeNull()
})

// Valid JSON is not the same as usable data. A bare string parses fine and then
// explodes on .map() in the component.
it('rejects valid JSON of the wrong shape', () => {
  localStorage.setItem(LS_MESSAGES_KEY, '"a string, not an array"')
  expect(readingLocalStorage()).toEqual([])

  localStorage.setItem(LS_MESSAGES_KEY, '{"not": "an array"}')
  expect(readingLocalStorage()).toEqual([])
})

it('drops individual entries that are not {id, message}', () => {
  localStorage.setItem(
    LS_MESSAGES_KEY,
    JSON.stringify([{ id: 'a', message: 'keep' }, { id: 1, message: 'bad id' }, null, { id: 'c' }])
  )
  expect(readingLocalStorage()).toEqual([{ id: 'a', message: 'keep' }])
})
