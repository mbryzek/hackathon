module Templates.Card exposing (renderCard, renderCardText)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)
    

renderCard : List (Html msg) -> Html msg
renderCard contents =
    div
        [ class "rounded overflow-hidden shadow-lg p-4 bg-white" ]
        contents

renderCardText : String -> Html msg
renderCardText contents =
    div [ class "text-gray-700 text-base mt-2" ] [ text contents ]
