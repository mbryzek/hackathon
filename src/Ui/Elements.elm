module Ui.Elements exposing (..)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)


textColor : String
textColor =
    "text-gray-800"


p : String -> Html msg
p content =
    Html.p [ class (textColor ++ " font-light")]
        [ text content ]

calloutBox : String -> String -> Html msg
calloutBox title contents =
    div [ class "bg-slate-700 rounded-lg p-6 mt-4 border-l-4 border-yellow-500 shadow-lg" ]
        [ div [ class "text-white text-sm uppercase tracking-wide font-bold mb-1" ]
            [ text title ]
        , div [ class "text-2xl font-bold text-white" ]
            [ text contents ]
        ]
