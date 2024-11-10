module Templates.PhotoGallery exposing (renderPhotoGallery)

import Html exposing (Html, div, img)
import Html.Attributes exposing (class, src)

renderPhotoGallery : List String -> Html msg
renderPhotoGallery images =
    div
        [ class "bg-white"
        ]
        [ div
                [ class "mt-6 grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8"
                ]
                (List.map tile images)
        ]
    

tile : String -> Html msg
tile url =
    div
        [ class "group relative gap-y-4" ] [
            div
                [ class "h-96 w-full overflow-hidden rounded-lg sm:aspect-h-3 sm:aspect-w-2 group-hover:opacity-75 sm:h-auto"
                ]
                [ img
                    [ src url
                    , class "h-full w-full object-cover object-center"
                    ]
                    []
                ]
            ]
