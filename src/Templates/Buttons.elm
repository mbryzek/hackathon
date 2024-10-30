module Templates.Buttons exposing (renderDefaultTextLink, renderDefaultButton, renderTextLink, renderCancelLink, renderDefaultCancelLink)

import Html
import Html.Attributes as Attr
import Html.Events exposing (onClick)


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
