module Templates.SimplePage exposing (render)

import Browser
import Html exposing (Html, div, text)
import Html.Attributes exposing (class)


render : String -> Html msg -> Browser.Document msg
render title contents =
    { title = title
    , body = [
        div [ class "flex flex-col items-center justify-center h-screen" ]
            [ div [ class "text-2xl font-bold" ] [ text title ]
            , div [ class "mt-4" ] [ contents ]
        ]
    ]
    }
