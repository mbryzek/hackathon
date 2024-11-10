module Page.Donate exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div, h2, h3, li, ul, a, img)
import Html.Attributes exposing (class, href, src)
import Templates.Shell exposing (renderShell)
import Ui.Elements exposing (p, textDiv)


type alias Model =
    { global : GlobalState }


type alias Msg = Never


init : GlobalState -> Model
init global =
    { global = global }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    never msg


view : Model -> Html Never
view _ =
    renderShell { title = "2024 Hackathon Event Summary" } [ summary ]


summary : Html Never
summary =
    textDiv
        [ p "The Bergen Tech Hackathon is only possible thanks to the generosity of our sponsors and donors. If you would like to support our mission of empowering the next generation of tech leaders, please consider donating to our cause."
        , div [class "mt-4"] [a [class "hover:underline", href "https://www.gofundme.com/f/bergen-tech-hackathon-2024"] [p "Donate to our cause here"]]
        , p "Thank you for your support!"
        ]
