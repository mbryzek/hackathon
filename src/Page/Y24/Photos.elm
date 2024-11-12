module Page.Y24.Photos exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html)
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Urls

type alias Model =
    { global : GlobalState
    , shell : ShellTemplate.Model }


type Msg =
    ShellTemplateMsg ShellTemplate.ShellMsg


init : GlobalState -> ( Model, Cmd Msg )
init global =
    let
        ( shell, shellCmd ) =
            ShellTemplate.init global.navKey
    in
    ( { global = global
      , shell = shell
      }
    , Cmd.map ShellTemplateMsg shellCmd
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShellTemplateMsg subMsg ->
            let
                ( updatedShell, shellCmd ) =
                    ShellTemplate.update subMsg model.shell
            in
            ( { model | shell = updatedShell }, Cmd.map ShellTemplateMsg shellCmd )


view : Model -> Html Msg
view model =
    renderShell model.shell ShellTemplateMsg {
        title = "2024 Photos", url = Just Urls.photos
    } [
        renderPhotoGallery allPhotoUrls
    ]


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
        , "IMG_6785.jpg"
        ]
