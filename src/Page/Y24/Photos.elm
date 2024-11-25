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
    List.map toUrl allFilenames


allFilenames : List String
allFilenames =
    [ "IMG_0968.640.JPG"
    , "IMG_1007.640.JPG"
    , "IMG_1080.640.JPG"
    , "IMG_1433.640.JPG"
    , "IMG_1515.640.jpg"
    , "IMG_6537.640.JPG"
    , "IMG_6565.640.JPG"
    , "IMG_6589.640.JPG"
    , "IMG_6643.640.JPG"
    , "IMG_6955.640.JPG"
    , "IMG_7474.640.JPG"
    , "IMG_0971.640.JPG"
    , "IMG_0975.640.JPG"
    , "IMG_1011.640.JPG"
    , "IMG_1091.640.JPG"
    , "IMG_1463.640.jpg"
    , "IMG_6480.640.JPG"
    , "IMG_6544.640.JPG"
    , "IMG_6576.640.JPG"
    , "IMG_6601.640.JPG"
    , "IMG_6658.640.JPG"
    , "IMG_6969.640.JPG"
    , "IMG_7506.640.JPG"
    , "IMG_0976.640.JPG"
    , "IMG_0986.640.JPG"
    , "IMG_1029.640.JPG"
    , "IMG_1130.640.JPG"
    , "IMG_1478.640.jpg"
    , "IMG_6521.640.JPG"
    , "IMG_6549.640.JPG"
    , "IMG_6582.640.JPG"
    , "IMG_6613.640.JPG"
    , "IMG_6842.640.JPG"
    , "IMG_7382.640.JPG"
    , "IMG_7513.640.JPG"
    , "IMG_0998.640.JPG"
    , "IMG_1000.640.JPG"
    , "IMG_1056.640.jpg"
    , "IMG_1272.640.JPG"
    , "IMG_1499.640.jpg"
    , "IMG_6532.640.jpg"
    , "IMG_6556.640.JPG"
    , "IMG_6585.640.JPG"
    , "IMG_6634.640.JPG"
    , "IMG_6935.640.JPG"
    , "IMG_7461.640.JPG"
    , "IMG_7520.640.JPG"
    , "IMG_1004.640.jpg"
    , "IMG_1070.640.JPG"
    , "IMG_1340.640.JPG"
    , "IMG_1506.640.jpg"
    , "IMG_6535.640.JPG"
    , "IMG_6560.640.JPG"
    , "IMG_6587.640.JPG"
    , "IMG_6637.640.JPG"
    , "IMG_6947.640.JPG"
    , "IMG_7473.640.JPG"
    , "IMG_7527.640.jpg"
    ]
