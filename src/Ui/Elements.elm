module Ui.Elements exposing (..)

import Html exposing (Html, a, div, text)
import Html.Attributes as Attr exposing (class)
import Html.Events exposing (onClick)


textColor : String
textColor =
    "text-gray-800"


textDiv : List (Html msg) -> Html msg
textDiv children =
    div [ class "max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed" ] children


p : String -> Html msg
p content =
    Html.p [ class (textColor ++ " font-light") ]
        [ text content ]


type alias CalloutBoxProps msg =
    { title : String, contents : Html msg }


calloutBox : CalloutBoxProps msg -> Html msg
calloutBox props =
    div [ class "bg-slate-700 rounded-lg p-6 mt-4 border-l-4 border-yellow-500 shadow-lg" ]
        [ div [ class "text-yellow-500 text-sm uppercase tracking-wide font-bold mb-1" ]
            [ text props.title ]
        , div [ class "text-2xl font-bold text-white" ]
            [ props.contents ]
        ]


calloutBox2 : CalloutBoxProps msg -> CalloutBoxProps msg -> Html msg
calloutBox2 props1 props2 =
    div [ class "flex gap-x-4" ]
        [ calloutBox props1
        , calloutBox props2
        ]


button : msg -> String -> Html msg
button msg label =
    div [ class "mt-8 text-center" ]
        [ Html.button
            [ class "inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transform hover:scale-105 transition duration-200 ease-in-out"
            , onClick msg
            ]
            [ text label ]
        ]


callToAction : String -> String -> Html msg
callToAction url label =
    div [ class "mt-8 text-center" ]
        [ a
            [ class "inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transform hover:scale-105 transition duration-200 ease-in-out"
            , Attr.href url
            ]
            [ text label ]
        ]
