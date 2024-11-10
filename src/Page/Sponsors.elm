module Page.Sponsors exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html)
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell exposing (renderShell)
import Ui.Elements exposing (p)
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


view : Model -> Html Never
view _ =
    renderShell { title = "2024 Sponsors", url = Just Urls.sponsors }
        [ p "A huge thank you to our sponsors who made our 2024 Hackathon possible!"
        , renderPhotoGallery logos
        ]
