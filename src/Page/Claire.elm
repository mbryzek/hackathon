module Page.Claire exposing (view)

import Browser
import Html exposing (div, h2, p, img)
import Html.Attributes exposing (class, src, alt, style)
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
            , img [ src "https://github.com/mbryzek/hackathon-photos/blob/main/claire/head.jpg?raw=true"
                  , alt "Claire's photo"
                  , style "width" "200px"
                  , style "border-radius" "50%"
                  ] []
            ]
        ] 