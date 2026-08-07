import { useEffect } from 'react'
import { LS_MESSAGES_KEY } from './constants'

// Persists on every change, and again when the page is being hidden.
//
// The previous version wrote ONLY in a beforeunload handler. Two problems with that:
//
//   1. beforeunload is unreliable on mobile. iOS Safari in particular does not fire it
//      when the user switches apps or the OS reclaims the tab, which is the most common
//      way a phone leaves a page. Everything typed was simply lost.
//   2. It also re-registered the listener on every render, because the effect had no
//      dependency array.
//
// visibilitychange (with pagehide as the desktop-Safari backstop) is the pair the
// browsers actually guarantee, and writing on change as well means the worst case is
// losing nothing rather than losing the session.
const useLocalStorage = messagesValues => {
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(messagesValues))
      } catch (err) {
        // QuotaExceededError, or storage disabled. Losing persistence is survivable;
        // taking the app down over it is not.
      }
    }

    save()

    const saveIfHidden = () => {
      if (document.visibilityState === 'hidden') save()
    }

    document.addEventListener('visibilitychange', saveIfHidden)
    window.addEventListener('pagehide', save)

    return () => {
      document.removeEventListener('visibilitychange', saveIfHidden)
      window.removeEventListener('pagehide', save)
    }
  }, [messagesValues])

  return null
}

export default useLocalStorage
