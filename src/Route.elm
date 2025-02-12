module Route exposing (Route(..), fromUrl)

import Url exposing (Url)
import Url.Parser exposing (..)


type Route
    = RouteIndex
    | RouteY24Index
    | RouteY24Photos
    | RouteSponsors
    | RouteDonate
    | RouteContact
fromUrl : Url -> Maybe Route
fromUrl url =
    parse matchRoute url


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map RouteIndex top
        , map RouteY24Index (s "Y24")
        , map RouteY24Photos (s "Y24" </> s "photos")
        , map RouteSponsors (s "sponsors")
        , map RouteDonate (s "donate")
        , map RouteContact (s "contact")
        ]
