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
    []
