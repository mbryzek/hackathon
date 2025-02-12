module Page.Contact exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div)
import Html.Attributes exposing (class)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (p, textDiv)
import Urls


type alias Model =
    { global : GlobalState
    , shell : ShellTemplate.Model }


init : GlobalState -> ( Model, Cmd Msg )
init global =
    let
        ( shell, shellCmd ) =
            ShellTemplate.init global.navKey
    in
    ( { global = global
      , shell = shell
      }
    , Cmd.map ShellTemplateMsg shellCmd
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShellTemplateMsg subMsg ->
            let
                ( updatedShell, shellCmd ) =
                    ShellTemplate.update subMsg model.shell
            in
            ( { model | shell = updatedShell }, Cmd.map ShellTemplateMsg shellCmd )


view : Model -> Html Msg
view model =
    renderShell model.shell ShellTemplateMsg {
        title = "Contact The Hackathon Organizers", url = Just Urls.contact
    } [ textDiv
            [ p "The Bergen Tech Hackathon is run by a group of volunteers. If you have any questions, please contact:"
            , div [ class "pl-4" ]
                [ p "Michael Bryzek"
                , p "mbryzek@gmail.com"
                ]
            ]
        ]
