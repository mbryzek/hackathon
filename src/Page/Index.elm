-- codegen.global.state: GlobalStateAnonymousData


module Page.Index exposing (Msg, update, view)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState, MainViewProps)
import Html exposing (Html, img, text)
import Html.Attributes exposing (class, src)
import Templates.Shell as Shell
import Ui.Elements exposing (button, p, textColor)
import Urls


type Msg
    = RedirectTo String


update : GlobalState -> Msg -> Cmd Msg
update global msg =
    case msg of
        RedirectTo url ->
            Nav.pushUrl global.navKey url


view : MainViewProps Msg mainMsg -> Shell.ViewProps mainMsg -> Browser.Document mainMsg
view { msgMap } shellProps =
    Shell.render shellProps "2025 Bergen Tech Hackathon" [ contents |> Html.map msgMap ]


contents : Html Msg
contents =
    Html.div [ class "flex flex-col gap-y-4" ]
        [ p "The Bergen Tech 2025 Hackathon was an incredible success!"
        , button (RedirectTo Urls.y25Index) "Read more about the 2025 Hackathon"
        , thankYouMessage
        , studentPhoto
        ]


thankYouMessage : Html Msg
thankYouMessage =
    Html.p [ class (textColor ++ " font-semibold text-center italic mt-8") ]
        [ text " Thank you for being a part of our community's growth and innovation! ❤️ " ]


studentPhoto : Html Msg
studentPhoto =
    img [ src "https://github.com/mbryzek/hackathon-static/blob/main/2025/everybody.w640.jpg?raw=true" ] []
