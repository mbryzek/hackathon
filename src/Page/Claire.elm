module Page.Claire exposing (view)

import Browser
import Html exposing (div, h2, h3, p, img)
import Html.Attributes exposing (class, src, alt, style)
import Templates.Shell as Shell


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props
        "Claire"
        [ div [ class "max-w-3xl mx-auto py-8" ]
            [ h2 [ class "text-2xl font-bold text-amber-800 mb-4" ]
                [ Html.text "Welcome to Claire's Page" ]
            , img [ src "https://github.com/mbryzek/hackathon-photos/blob/main/claire/head.jpg?raw=true"
                  , alt "Claire's photo"
                  , style "width" "200px"
                  , style "border-radius" "50%"
                  ] []
            , p [ class "mt-4 mb-4 text-lg" ]
                [ Html.text "Exciting news! I'm heading to Cancun tomorrow for some sun and relaxation! I'll be staying at the GR Solaris Cancun resort. 🌴☀️" ]
            , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ]
                [ Html.text "This is where we are staying!" ]
            , img [ src "https://images.trvl-media.com/lodging/2000000/1120000/1110100/1110099/1d5a8cd9.jpg?impolicy=resizecrop&rw=1200&ra=fit"
                  , alt "GR Solaris Cancun resort"
                  , class "w-full max-w-lg rounded-lg shadow-lg mt-2 mx-auto block"
                  ] []
            , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ]
                [ Html.text "This is a photo of the town of Cancun" ]
            , img [ src "https://images.unsplash.com/photo-1552074284-5e88ef1aef18"
                  , alt "Beautiful Cancun beach with turquoise water and white sand"
                  , class "w-full max-w-lg rounded-lg shadow-lg mt-2 mx-auto block"
                  ] []
            ]
        ] 