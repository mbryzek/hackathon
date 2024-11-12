module Page.Sponsors exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html)
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (p)
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
            ShellTemplate.init
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


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-photos/blob/main/2024/sponsors/" ++ filename ++ "?raw=true"


logos : List String
logos =
    List.map toUrl
        [ "mek-review.png"
        , "CarbonSustainLogo.png"
        , "Catalano-LOGO new.jpg"
        , "Catalano-LOGO.jpg"
        , "Fran EP Logo.jpg"
        , "Sunrise Logo (2).png"
        , "WCCG_Logo_final.jpg"
        , "pan.jpg"
        , "Bryzek Logo V2.1.jpg"
        ]


view : Model -> Html Msg
view model =
    renderShell model.shell ShellTemplateMsg {
        title = "2024 Sponsors", url = Just Urls.sponsors
    }
        [ p "A huge thank you to our sponsors who made our 2024 Hackathon possible!"
        , renderPhotoGallery logos
        ]
