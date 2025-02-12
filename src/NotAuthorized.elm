module NotAuthorized exposing (view)

import Browser
import Html exposing (Html, a, div, p, text)
import Html.Attributes exposing (class, href)
import Templates.SimplePage as SimplePage


view : Browser.Document msg
view =
    SimplePage.render "Page not found" contents


contents : Html msg
contents =
    div
        [ class "text-center p-4" ]
        [ p
            [ class "text-gray-500 max-w-lg mx-auto" ]
            [ a
                [ href "/"
                , class "text-indigo-600 underline hover:no-underline"
                ]
                [ text "Go to the home page" ]
            ]
        ]
