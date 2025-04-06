-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Photos exposing (Model, Msg, init, update, view)

import Browser
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell as Shell
import Random
import Random.List
import Ui.Elements exposing (p)
type alias Model =
    { randomSeed : Random.Seed
    }


type Msg =
    GotRandomSeed Int


init : ( Model, Cmd Msg )
init =
    ( { randomSeed = Random.initialSeed 0
      }
    , Random.generate GotRandomSeed (Random.int Random.minInt Random.maxInt)
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotRandomSeed seed ->
            ( { model | randomSeed = Random.initialSeed seed }, Cmd.none )


view : Shell.ViewProps msg -> Model -> Browser.Document msg
view props model =
    Shell.render props "2025 Photos" [
        if List.isEmpty allFilenames then
            p "Coming soon!"
        else
            renderPhotoGallery (shuffledPhotoUrls model.randomSeed)
    ]


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-photos/blob/main/2025/ambiance/" ++ filename ++ "?raw=true"


shuffledPhotoUrls : Random.Seed -> List String
shuffledPhotoUrls seed =
    Random.step (Random.List.shuffle (List.map toUrl allFilenames)) seed
        |> Tuple.first


allFilenames : List String
allFilenames =
    [
        "IMG_8706.w640.JPG",
        "IMG_8755.w640.JPG",
        "IMG_8761.w640.JPG",
        "IMG_8777.w640.JPG",
        "IMG_8813.w640.JPG",
        "IMG_8832.w640.JPG",
        "IMG_8852.w640.JPG",
        "everybody-all.w640.JPG",
        "IMG_8714.w640.jpg",
        "IMG_8756.w640.JPG",
        "IMG_8762.w640.JPG",
        "IMG_8784.w640.JPG",
        "IMG_8818.w640.JPG",
        "IMG_8833.w640.JPG",
        "IMG_8857.w640.JPG",
        "everybody-fun.w640.JPG",
        "IMG_8728.w640.JPG",
        "IMG_8757.w640.JPG",
        "IMG_8764.w640.JPG",
        "IMG_8789.w640.JPG",
        "IMG_8825.w640.JPG",
        "IMG_8838.w640.JPG",
        "IMG_8859.w640.JPG",
        "IMG_8752.w640.JPG",
        "IMG_8758.w640.JPG",
        "IMG_8765.w640.JPG",
        "IMG_8797.w640.JPG",
        "IMG_8826.w640.JPG",
        "IMG_8849.w640.JPG",
        "IMG_8860.w640.JPG",
        "IMG_8753.w640.JPG",
        "IMG_8759.w640.JPG",
        "IMG_8772.w640.JPG",
        "IMG_8803.w640.JPG",
        "IMG_8829.w640.JPG",
        "IMG_8850.w640.JPG",
        "IMG_8865.w640.JPG",
        "IMG_8754.w640.JPG",
        "IMG_8760.w640.JPG",
        "IMG_8776.w640.JPG",
        "IMG_8809.w640.JPG",
        "IMG_8831.w640.JPG",
        "IMG_8851.w640.JPG",
        "IMG_8866.w640.JPG"
    ]
