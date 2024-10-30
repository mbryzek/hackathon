module Global exposing (GlobalState,  SessionState(..))

import Browser.Navigation as Nav
import Generated.ComBryzekAcumenApi exposing (Session)

type SessionState =
  SessionLoggedIn Session
  | SessionLoggedOut


type alias GlobalState =
    { session: SessionState
    , navKey : Nav.Key }
