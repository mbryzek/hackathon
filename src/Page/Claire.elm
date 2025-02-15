module Page.Claire exposing (view)

import Browser
import Html exposing (div, h2, p)
import Html.Attributes exposing (class)
import Templates.Shell as Shell


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props
        "Claire"
        [ div [ class "max-w-3xl mx-auto py-8" ]
            [ h2 [ class "text-2xl font-bold text-amber-800 mb-4" ]
                [ Html.text "Welcome to Claire's Page" ]
            , p [ class "mb-4" ]
                [ Html.text "This is Claire's new page. Content coming soon!" ]
            ]
        ] 