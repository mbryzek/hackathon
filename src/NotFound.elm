module NotFound exposing (view)

import Browser
import Html exposing (Html, a, div, text, p)
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
            [ text "We couldn't find the page you're looking for. Please check the URL or "
            , a 
                [ href "/"
                , class "text-indigo-600 underline hover:no-underline" 
                ] 
                [ text "navigate back to the home page." ]
            ]
        ]
