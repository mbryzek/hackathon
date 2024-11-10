module Ui.Elements exposing (..)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)


textColor : String
textColor =
    "text-gray-800"


textDiv : List (Html msg) -> Html msg
textDiv children =
    div [ class "max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed" ] children



p : String -> Html msg
p content =
    Html.p [ class (textColor ++ " font-light")]
        [ text content ]

type alias CalloutBoxProps =
    { title: String, contents: String }

calloutBox : CalloutBoxProps -> Html msg
calloutBox props =
    div [ class "bg-slate-700 rounded-lg p-6 mt-4 border-l-4 border-yellow-500 shadow-lg" ]
        [ div [ class "text-white text-sm uppercase tracking-wide font-bold mb-1" ]
            [ text props.title ]
        , div [ class "text-2xl font-bold text-white" ]
            [ text props.contents ]
        ]

calloutBox2 : CalloutBoxProps -> CalloutBoxProps -> Html msg
calloutBox2 props1 props2 =
    div [class "flex gap-x-4"] [
        calloutBox props1,
        calloutBox props2
    ]