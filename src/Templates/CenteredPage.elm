module Templates.CenteredPage exposing (Params, emailInput, link, passwordInput, renderCenteredPage, renderLoading)

import Constants exposing (logoSvg)
import Html exposing (Html, div, h2, p, text)
import Html.Attributes as Attr
import Templates.Buttons exposing (renderDefaultTextLink)
import Templates.Forms exposing (input)


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
                , Attr.alt "Acumen"
                ]
                [ logoSvg ]
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


linkNoMargin : msg -> String -> Html msg
linkNoMargin msg label =
    p
        [ Attr.class "text-center text-sm text-gray-500"
        ]
        [ renderDefaultTextLink msg label
        ]


emailInput : (String -> msg) -> Html msg
emailInput onInput =
    input []
        { id = "email"
        , label = "Email address"
        , type_ = "email"
        , value = Nothing
        , required = True
        , autocomplete = Just "email"
        , onInput = onInput
        , rightLabel = Nothing
        }


passwordInput : Maybe msg -> (String -> msg) -> Html msg
passwordInput onForgotPassword onInput =
    input []
        { id = "password"
        , label = "Password"
        , type_ = "password"
        , value = Nothing
        , required = True
        , autocomplete = Just "current-password"
        , onInput = onInput
        , rightLabel = Maybe.map (\m -> linkNoMargin m "Forgot your password?") onForgotPassword
        }


renderLoading : Html msg
renderLoading =
    renderCenteredPage { title = "Acumen" }
        [ Html.p [ Attr.class "italic" ] [ Html.text "Loading..." ]
        ]
