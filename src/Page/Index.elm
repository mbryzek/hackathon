-- codegen.global.state: GlobalStateAnonymousData


module Page.Index exposing (Msg, update, view)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState, MainViewProps)
import Html exposing (Html, img, text)
import Html.Attributes exposing (attribute, class, height, src, width)
import Templates.Shell as Shell
import Ui.Elements exposing (button, textColor)
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
    Shell.render shellProps "Bergen Tech Hackathon" [ contents |> Html.map msgMap ]


contents : Html Msg
contents =
    Html.div [ class "flex flex-col gap-y-4" ]
        [ saveTheDate
        , hackathon2025Video
        , button (RedirectTo Urls.y25Index) "Read more about the incredible 2025 Hackathon"
        , thankYouMessage
        , studentPhoto
        ]


hackathon2025Video : Html Msg
hackathon2025Video =
    Html.div [ class "flex justify-center mt-4" ]
        [ Html.iframe
            [ src "https://www.youtube.com/embed/phM9BT55MlE"
            , width 560
            , height 315
            , attribute "allow" "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            , attribute "allowfullscreen" ""
            , attribute "frameborder" "0"
            , class "max-w-full"
            ]
            []
        ]


saveTheDate : Html Msg
saveTheDate =
    Html.p [ class (textColor ++ " font-bold text-2xl text-center italic mt-8") ]
        [ text "Save the date: 2026 Bergen Tech Hackathon will be on April 18, 2026" ]


thankYouMessage : Html Msg
thankYouMessage =
    Html.p [ class (textColor ++ " font-semibold text-center italic mt-8") ]
        [ text " Thank you for being a part of our community's growth and innovation! ❤️ " ]


studentPhoto : Html Msg
studentPhoto =
    img [ src "https://github.com/mbryzek/hackathon-static/blob/main/2025/everybody.w640.jpg?raw=true" ] []
