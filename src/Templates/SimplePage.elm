module Templates.SimplePage exposing (render)

import Browser
import Constants exposing (logoSrc)
import Html exposing (Html, a, div, h1, header, img, main_, nav, text)
import Html.Attributes as Attr exposing (class)
import Ui.Elements exposing (textColor)
import Urls

render : String -> Html msg -> Browser.Document msg
render title contents =
    { title = title
    , body = [renderBody title contents]
    }



renderBody : String -> Html msg -> Html msg
renderBody title contents =
    div
        [ class "min-h-full"
        ]
        [ nav
            [ class "bg-gray-800"
            ]
            [ div
                [ class "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                ]
                [ div
                    [ class "flex h-16 items-center justify-between"
                    ]
                    [ div
                        [ class "flex items-center"
                        ]
                        [ logo
                        ]
                    ]
                ]
            ]
        , header
            [ class "bg-white shadow-sm"
            ]
            [ div
                [ class "mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
                ]
                [ h1
                    [ class (textColor ++ " text-lg/6 font-semibold")
                    ]
                    [ text title ]
                ]
            ]
        , main_ []
            [ div
                [ class "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                ]
                [ contents ]
            ]
        ]


logo : Html msg
logo =
    div
        [ class "shrink-0" ]
        [ a [
            Attr.href Urls.index
            ] [img
                [ class "h-12 w-36"
                , Attr.src logoSrc
                , Attr.alt "2025 Bergen Tech Hackathon"
                ]
                []
            ]
        ]
