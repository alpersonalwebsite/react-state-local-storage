import React, { useState } from 'react'
import uuidv1 from 'uuid/v1'
import useLocalStorage from './useLocalStorage'
import readingLocalStorage from './readingLocalStorage'
import { LS_MESSAGES_KEY } from './constants'

function App() {
  const [messageState, setMessageState] = useState('')

  // Lazy initialiser. `useState(readingLocalStorage())` called it on EVERY render and
  // threw the result away after the first, so every keystroke re-read and re-parsed
  // localStorage for nothing. Passing the function defers it to the initial render only.
  const [messagesState, setMessagesState] = useState(readingLocalStorage)
  useLocalStorage(messagesState)

  const onChangeInputMessageHandler = e => {
    setMessageState(e.target.value)
  }

  const onSubmitHandler = e => {
    e.preventDefault()

    // Empty submissions used to add a blank row: the form had no validation at all.
    const message = messageState.trim()
    if (!message) return

    setMessageState('')

    // Functional update. The old version read `messagesState` from the closure, which
    // is the stale-value trap: two submissions in the same batch would both start from
    // the same array and the first would be lost.
    setMessagesState(current => [...current, { id: uuidv1(), message }])
  }

  // We are using just one key... LS_MESSAGES_KEY
  const deleteKeyFromLS = () => {
    setMessagesState([])
    localStorage.removeItem(LS_MESSAGES_KEY)
  }

  let messageList = null
  messageList = messagesState.map(message => <li key={message.id}> {message.message} </li>)

  return (
    <React.Fragment>
      <form onSubmit={onSubmitHandler}>
        <label htmlFor="message"> Add a message: </label>{' '}
        <input name="message" value={messageState} onChange={onChangeInputMessageHandler} /> <button> Add! </button>{' '}
      </form>{' '}
      <ul> {messageList} </ul> <hr />
      <button onClick={deleteKeyFromLS}> Clear All! </button>{' '}
    </React.Fragment>
  )
}

export default App
