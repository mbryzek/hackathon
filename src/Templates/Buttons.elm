module Templates.Buttons exposing (renderDefaultTextLink, renderButtonRequest, renderDefaultButton, renderTextLink, renderCancelLink, renderDefaultCancelLink, renderTextLinkRequest)

import Html exposing (Html, div)
import Html.Attributes as Attr exposing (class)
import Html.Events exposing (onClick)
import Generated.ApiRequest as ApiRequest exposing (ApiRequest)
import Templates.Messages exposing (viewNonFieldErrors)


renderDefaultCancelLink : msg -> Html.Html msg
renderDefaultCancelLink onClickMsg =
    renderCancelLink [] onClickMsg


renderCancelLink : List (Html.Attribute msg) -> msg -> Html.Html msg
renderCancelLink additionalAttributes onClickMsg =
    Html.div (List.append additionalAttributes [
        onClick onClickMsg
        , Attr.class "cursor-pointer leading-6 italic text-sm text-gray-600 hover:text-gray-500 hover:underline"
    ]) [Html.text "Cancel"]

renderDefaultTextLink : msg -> String -> Html.Html msg
renderDefaultTextLink onClickMsg label =
    renderTextLink [] onClickMsg label


renderTextLink : List (Html.Attribute msg) -> msg -> String -> Html.Html msg
renderTextLink additionalAttributes onClickMsg label =
    renderLink additionalAttributes onClickMsg [ Html.text label ]

renderTextLinkRequest : List (Html.Attribute msg) -> ApiRequest a -> msg -> String -> Html.Html msg
renderTextLinkRequest additionalAttributes request onClickMsg label =
    let
        loading : String
        loading =
            case request of
                ApiRequest.Loading ->
                    " (Loading...)"

                _ ->
                    ""
    in
    Html.div (List.append additionalAttributes (linkAttributes onClickMsg)) [(Html.text (label ++ loading))]


linkAttributes : msg -> List (Html.Attribute msg)
linkAttributes onClickMsg = 
    [ onClick onClickMsg
      , Attr.class "cursor-pointer font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline" ]

renderLink : List (Html.Attribute msg) -> msg -> List (Html.Html msg) -> Html.Html msg
renderLink additionalAttributes onClickMsg contents =
    Html.div (List.append additionalAttributes (linkAttributes onClickMsg)) contents


renderDefaultButton : msg -> String -> Html.Html msg
renderDefaultButton onClickMsg label =
    renderButton [] onClickMsg label


buttonCss : String
buttonCss =
    "rounded bg-indigo-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"

renderButton : List (Html.Attribute msg) -> msg -> String -> Html.Html msg
renderButton additionalAttributes onClickMsg label =
    Html.button (List.append additionalAttributes [
        Attr.class buttonCss
        , onClick onClickMsg
    ]) [Html.text label]


renderButtonRequest : List (Html.Attribute msg) -> ApiRequest a -> msg -> String -> Html msg
renderButtonRequest additionalAttributes request msg label =
    let
        (disabled, finalLabel) =
            case request of
                ApiRequest.Loading ->
                    (True, "Loading...")

                _ ->
                    (False, label)
    in
    Html.div []
        (maybeAppendErrors request (Html.button
            (List.append additionalAttributes [ Attr.type_ "submit"
            , Attr.class buttonCss
            , onClick msg
            , Attr.disabled disabled
            ])
            [ Html.text finalLabel ]
        ))

maybeAppendErrors : ApiRequest a -> Html msg -> List (Html.Html msg)
maybeAppendErrors request contents =
    let
        errors: List (Html.Html msg)
        errors =
            case request of
                ApiRequest.Failure _ ->
                    [ viewNonFieldErrors request ]
                _ ->
                    []
    in
    if List.isEmpty errors then
        [contents]
    else
        [contents
        , div [class "mt-4"] errors
        ]
