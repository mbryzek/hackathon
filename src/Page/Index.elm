module Page.Index exposing (Model, Msg, init, update, view)

import Browser.Navigation as Nav
import Global exposing (GlobalState)
import Html exposing (Html, div)
import Templates.Buttons exposing (renderDefaultTextLink)
import Templates.CenteredPage exposing (renderCenteredPage)


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
    renderCenteredPage { title = "Bergen Tech Hackathon" }
        [ div [] [ Html.text "Welcome" ]
        , renderDefaultTextLink (RedirectTo "/login")  "Login" 
        ]
