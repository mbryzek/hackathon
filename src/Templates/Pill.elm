module Templates.Pill exposing (renderPill)

import Html exposing (Html, button, span, text)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)


renderPill : msg -> String -> Html msg
renderPill onDelete label =
    span [ class "inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold" ]
        [ text label
        , button
            [ class "ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
            , onClick onDelete
            ]
            [ span [ class "align-top text-xs" ] [ text "×" ] ]
        ]
