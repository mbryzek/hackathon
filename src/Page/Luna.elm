module Page.Luna exposing (view)

import Browser
import Html exposing (Html, div, h2, h3, li, ul, img, p)
import Html.Attributes exposing (class, src, alt)
import Templates.Shell as Shell


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props "Luna - My Amazing Dog" 
        [ div [ class "max-w-3xl mx-auto py-8 flex flex-col md:flex-row gap-8" ]
            [ img 
                [ src "https://images.unsplash.com/photo-1615233500064-caa995e2f9dd"
                , alt "A beautiful red-coated collie/shepherd mix similar to Luna"
                , class "md:w-1/3 rounded-lg shadow-lg object-cover h-[300px]"
                ] []
            , div [ class "md:w-2/3" ]
                [ h2 [ class "text-2xl font-bold text-amber-800 mb-4" ] 
                    [ Html.text "Meet Luna" ]
                , p [ class "mb-4" ] 
                    [ Html.text "Luna is a stunning collie/Australian shepherd mix with a gorgeous ruby red coat that resembles a fox. Her medium-length fur and elegant appearance make her truly unique, combining the grace and intelligence of both breeds with a striking red coloration that turns heads wherever she goes." ]
                , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ] 
                    [ Html.text "Why Dogs Are Our Best Friends" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [] [ Html.text "Unconditional love and loyalty" ]
                    , li [] [ Html.text "Emotional support and companionship" ]
                    , li [] [ Html.text "Protection and security" ]
                    , li [] [ Html.text "Motivation to stay active and healthy" ]
                    , li [] [ Html.text "A constant source of joy and laughter" ]
                    ]
                ]
            ]
        ]

