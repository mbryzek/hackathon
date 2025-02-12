module Page.Contact exposing (Model, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div)
import Html.Attributes exposing (class)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (p, textDiv)
import Urls

view : GlobalState -> Html msg
view global =
    renderShell model.shell ShellTemplatemsg {
        title = "Contact The Hackathon Organizers", url = Just Urls.contact
    } [ textDiv
            [ p "The Bergen Tech Hackathon is run by a group of volunteers. If you have any questions, please contact:"
            , div [ class "pl-4" ]
                [ p "Michael Bryzek"
                , p "mbryzek@gmail.com"
                ]
            ]
        ]
