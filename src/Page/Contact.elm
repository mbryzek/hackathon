-- codegen.global.state: GlobalStateAnonymousData
module Page.Contact exposing (view)

import Browser
import Html exposing (div)
import Html.Attributes exposing (class)
import Templates.Shell as Shell
import Ui.Elements exposing (p, textDiv)

view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props "Contact The Hackathon Organizers" [
        textDiv
            [ p "The Bergen Tech Hackathon is run by a group of volunteers. If you have any questions, please contact:"
            , div [ class "pl-4" ]
                [ p "Michael Bryzek"
                , p "mbryzek@gmail.com"
                ]
            ]
    ]
