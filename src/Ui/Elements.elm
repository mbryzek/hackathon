module Ui.Elements exposing (..)

import Html exposing (Html)
import Html.Attributes exposing (class)


textColor : String
textColor =
    "text-gray-800"


p : String -> Html msg
p content =
    Html.p [ class (textColor ++ " font-light")]
        [ Html.text content ]
