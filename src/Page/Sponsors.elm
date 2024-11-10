module Page.Sponsors exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html)
import Templates.PhotoGallery exposing (renderPhotoGallery)

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
    List.map toUrl [ "Bryzek Logo V2.1.jpg"
    , "CarbonSustainLogo.png"
    , "Catalano-LOGO new.jpg"
    , "Catalano-LOGO.jpg"
    , "Fran EP Logo.jpg"
    , "MEK Review Logo.pdf"
    , "Sunrise Logo (2).png"
    , "WCCG_Logo_final.jpg"
    , "pan.jpg"
    ]


view : Model -> Html Never
view _ =
    renderPhotoGallery { title = "2024 Sponsors" } logos
