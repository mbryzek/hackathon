module Templates.Buttons exposing (renderDefaultTextLink)

import Html
import Html.Attributes as Attr
import Html.Events exposing (onClick)


renderDefaultTextLink : msg -> String -> Html.Html msg
renderDefaultTextLink onClickMsg label =
    renderTextLink [] onClickMsg label


renderTextLink : List (Html.Attribute msg) -> msg -> String -> Html.Html msg
renderTextLink additionalAttributes onClickMsg label =
    renderLink additionalAttributes onClickMsg [ Html.text label ]


linkAttributes : msg -> List (Html.Attribute msg)
linkAttributes onClickMsg =
    [ onClick onClickMsg
    , Attr.class "cursor-pointer font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline"
    ]


renderLink : List (Html.Attribute msg) -> msg -> List (Html.Html msg) -> Html.Html msg
renderLink additionalAttributes onClickMsg contents =
    Html.div (List.append additionalAttributes (linkAttributes onClickMsg)) contents
