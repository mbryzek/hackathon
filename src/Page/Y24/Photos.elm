module Page.Y24.Photos exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div, img)
import Html.Attributes exposing (class, src)
import Templates.Shell exposing (renderShell)


type alias Model =
    { global : GlobalState }


type alias Msg = Never


init : GlobalState -> Model
init global =
    { global = global }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    never msg


view : Model -> Html Never
view _ =
    renderShell { title = "2024 Photos" } [ photosAsTiles ]

toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-photos/blob/main/2024/ambiance/" ++ filename ++ "?raw=true"

allPhotoUrls : List String
allPhotoUrls =
    List.map toUrl [
        "IMG_0974.jpg"
        , "IMG_1004.jpg"
        , "IMG_1463.jpg"
        , "IMG_1470.jpg"
        , "IMG_1485.jpg"
        , "IMG_1499.jpg"
        , "IMG_1506.jpg"
        , "IMG_6526.jpg"
        , "IMG_6532.jpg"
        , "IMG_0999.jpg"
    ]


photosAsTiles : Html Never
photosAsTiles =
    div
        [ class "bg-white"
        ]
        [ div
                [ class "mt-6 grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8"
                ]
                (List.map photoTile allPhotoUrls)
        ]
    

photoTile : String -> Html Never
photoTile url =
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