module Global exposing (GlobalState, SessionState(..))

import Browser.Navigation as Nav

type SessionState =
  SessionLoggedOut


type alias GlobalState =
    { session: SessionState
    , navKey : Nav.Key }
