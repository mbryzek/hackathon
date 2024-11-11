module Page.Contact exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div)
import Html.Attributes exposing (class)
import Templates.Shell exposing (renderShell)
import Ui.Elements exposing (p, textDiv)
import Urls


type alias Model =
    { global : GlobalState }


type alias Msg =
    Never


init : GlobalState -> Model
init global =
    { global = global }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    never msg


view : Model -> Html Never
view _ =
    renderShell { title = "Contact The Hackathon Organizers", url = Just Urls.contact }
        [ textDiv
            [ p "The Bergen Tech Hackathon is run by a group of volunteers. If you have any questions, please contact:"
            , div [ class "pl-4" ]
                [ p "Michael Bryzek"
                , p "mbryzek@gmail.com"
                ]
            ]
        ]
