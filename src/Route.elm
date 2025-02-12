module Route exposing (Route(..), fromUrl)

import Url exposing (Url)
import Url.Parser exposing (..)


type Route
    = PageIndex
    | PageY24Index
    | PageY24Photos
    | PageSponsors
    | PageDonate
    | PageContact
fromUrl : Url -> Maybe Route
fromUrl url =
    parse matchRoute url


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map PageIndex top
        , map PageY24Index (s "Y24")
        , map PageY24Photos (s "Y24" </> s "photos")
        , map PageSponsors (s "sponsors")
        , map PageDonate (s "donate")
        , map PageContact (s "contact")
        ]
