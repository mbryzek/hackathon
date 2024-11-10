module Page.Index exposing (Model, Msg, init, update, view)

import Browser.Navigation as Nav
import Global exposing (GlobalState)
import Html exposing (Html, text)
import Html.Attributes exposing (class)
import Templates.Shell exposing (renderShell, link)
import Ui.Elements exposing (p, textColor, textDiv, calloutBox2)
import Urls


type alias Model =
    { global : GlobalState
    }


type Msg
    = RedirectTo String


init : GlobalState -> Model
init global =
    { global = global
    }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        RedirectTo u ->
            ( model, Nav.pushUrl model.global.navKey u )


view : Model -> Html Msg
view _ =
    renderShell { title = "2025 Bergen Tech Hackathon" } [ intro ]


intro : Html Msg
intro =
    textDiv [
        calloutBox2 {
            title = "Date & Time"
            , contents = Html.div [class "flex flex-col gap-y-2"] [
                Html.div [] [Html.text "April 6, 2025"]
                , Html.div [] [Html.text "9am - 9pm"]
            ]
        } {
            title = "Location"
            , contents = Html.div [class "flex flex-col gap-y-2"] [
                Html.div [] [Html.text "Bergen Tech High School"]
                , Html.div [] [Html.text "Teterboro NJ"]
            ]
        }
        , p " The Bergen Tech Computer Science Parents group is very pleased to announce the second annual Computer Science Hackathon in collaboration with the BT Code Club and Computer Science Major. This event is an amazing opportunity for our students to have fun, learn and build software together. "
        , p " We need your help! To make this event a huge success, we're seeking donations from individuals and companies interested in sponsoring the event. All donations are tax deductible and 100% of the funds raised directly support this event. "
        , p " Every contribution, big or small, makes a difference. Let's come together to inspire and nurture the next generation of tech wizards at Bergen Tech! "
        , link (RedirectTo Urls.donate) "Donate to or Sponsor this years event"
        , thankYouMessage
    ]


thankYouMessage : Html Msg
thankYouMessage =
    Html.p [ class (textColor ++ " font-semibold text-center italic mt-8") ]
        [ text " Thank you for being a part of our community's growth and innovation! ❤️ " ]

