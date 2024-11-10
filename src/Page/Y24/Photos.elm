module Page.Y24.Photos exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html)
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell exposing (renderShell)
import Urls


type alias Model =
    { global : GlobalState }


type alias Msg =
    Never


init : GlobalState -> Model
init global =
    { global = global }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    never msg


view : Model -> Html Never
view _ =
    renderShell { title = "2024 Photos", url = Just Urls.photos } [ renderPhotoGallery allPhotoUrls ]


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-photos/blob/main/2024/ambiance/" ++ filename ++ "?raw=true"


allPhotoUrls : List String
allPhotoUrls =
    List.map toUrl
        [ "IMG_0974.jpg"
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
