module Templates.VideoGallery exposing (VideoInfo, renderVideoGallery)

import Html exposing (Html, div, video, source, p)
import Html.Attributes exposing (class, src, controls, type_, preload)

type alias VideoInfo =
    { url : String
    , title : String
    }

renderVideoGallery : List VideoInfo -> Html msg
renderVideoGallery videos =
    div
        [ class "bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" ]
        [ div
                [ class "mt-6 grid grid-cols-1 gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-none mx-auto" ]
                (List.map videoTile videos)
        ]
    

videoTile : VideoInfo -> Html msg
videoTile info =
    div
        [ class "p-4 group relative" ]
        [ div
                [ class "w-full overflow-hidden rounded-xl shadow-md hover:shadow-xl transition duration-300" ]
                [ video
                    [ controls True
                    , preload "auto"
                    , class "w-full h-full object-cover"
                    ]
                    [ source [ src info.url, type_ "video/mp4" ] []
                    , Html.text "Your browser does not support the video tag."
                    ]
                ]
        , p [ class "mt-2 text-lg font-medium text-gray-900" ]
            [ Html.text info.title ]
        ] 