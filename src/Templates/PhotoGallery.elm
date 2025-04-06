module Templates.PhotoGallery exposing (renderPhotoGallery)

import Html exposing (Html, div, img, a)
import Html.Attributes exposing (class, src, href)

renderPhotoGallery : List String -> Html msg
renderPhotoGallery images =
    div
        [ class "bg-white px-4 sm:px-6 lg:px-12 max-w-8xl mx-auto" ]
        [ div
                [ class "mt-6 grid grid-cols-1 gap-y-8 gap-x-4 sm:gap-8 md:gap-10 lg:gap-12 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-sm sm:max-w-none mx-auto" ]
                (List.map tile images)
        ]
    

tile : String -> Html msg
tile url =
    div
        [ class "group relative" ]
        [ div
                [ class "w-full overflow-hidden rounded-lg group-hover:opacity-75 hover:shadow-lg transition duration-300" ]
                [ a [ href url ] [
                    img
                        [ src url
                        , class "h-auto w-full object-contain"
                        ]
                        []
                ]
                ]
        ]
