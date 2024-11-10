module Route exposing (Route(..), parseUrl)

import Url exposing (Url)
import Url.Parser exposing (..)


type Route
    = PageIndex
    | PageY24Index


parseUrl : Url -> Maybe Route
parseUrl url =
    parse matchRoute url


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map PageIndex top
        , map PageY24Index (s "Y24")
        ]
