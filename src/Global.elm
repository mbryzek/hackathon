module Global exposing (..)

import Browser.Navigation as Nav
import Url

type alias MainViewProps a b =
    { global : GlobalState
    , msgMap : a -> b
    }

type alias GlobalState =
    { navKey : Nav.Key, url: Url.Url }

getNavKey : GlobalState -> Nav.Key
getNavKey global =
    global.navKey
