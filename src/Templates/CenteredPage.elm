module Templates.CenteredPage exposing (Params, link, renderCenteredPage)

import Constants exposing (logoImg)
import Html exposing (Html, div, h2, p, text)
import Html.Attributes as Attr
import Templates.Buttons exposing (renderDefaultTextLink)


type alias Params =
    { title : String }


renderCenteredPage : Params -> List (Html msg) -> Html msg
renderCenteredPage params contents =
    let
        divClass : Maybe String -> Html.Attribute msg
        divClass extra =
            let
                rest : String
                rest =
                    case extra of
                        Just e ->
                            " " ++ e

                        Nothing ->
                            ""
            in
            Attr.class ("sm:mx-auto sm:w-full sm:max-w-sm" ++ rest)
    in
    div
        [ Attr.class "flex min-h-full flex-col justify-center px-6 py-12 lg:px-8"
        ]
        [ div
            [ divClass Nothing
            ]
            [ p
                [ Attr.class "flex justify-center"
                , Attr.alt "Bergen Tech Hackathon"
                ]
                [ logoImg ]
            , h2
                [ Attr.class "mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
                ]
                [ text params.title ]
            ]
        , div
            [ divClass (Just "mt-10")
            ]
            contents
        ]


link : msg -> String -> Html msg
link msg label =
    p
        [ Attr.class "mt-5 text-center text-sm text-gray-500"
        ]
        [ renderDefaultTextLink msg label
        ]
