module Templates.SimplePage exposing (render)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)


render : String -> List (Html msg) -> Html msg
render title contents =
    div [ class "flex flex-col items-center justify-center h-screen" ]
        [ div [ class "text-2xl font-bold" ] [ text title ]
        , div [ class "mt-4" ] contents
        ]
