module Route exposing (Route(..), fromUrl)

import Url exposing (Url)
import Url.Parser exposing (..)


type Route
    = RouteIndex
    | RouteY24Index
    | RouteY24Photos
    | RouteY24Sponsors
    | RouteY25Prizes
    | RouteDonate
    | RouteContact
    | RouteLuna
    | RouteClaire

fromUrl : Url -> Maybe Route
fromUrl url =
    parse matchRoute url


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map RouteIndex top
        , map RouteY24Index (s "Y24")
        , map RouteY24Photos (s "Y24" </> s "photos")
        , map RouteY24Sponsors (s "Y24" </> s "sponsors")
        , map RouteY25Prizes (s "Y25" </> s "prizes")
        , map RouteDonate (s "donate")
        , map RouteContact (s "contact")
        , map RouteLuna (s "luna")
        , map RouteClaire (s "claire")
        ]
