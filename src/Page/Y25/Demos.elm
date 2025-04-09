-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Demos exposing (Model, Msg, init, update, view)

import Browser
import Templates.VideoGallery exposing (renderVideoGallery, VideoInfo)
import Templates.Shell as Shell
import Random
import Random.List
import Ui.Elements exposing (p)

type alias Model =
    { randomSeed : Maybe Random.Seed
    }


type Msg =
    GotRandomSeed Int


init : ( Model, Cmd Msg )
init =
    ( { randomSeed = Nothing
      }
    , Random.generate GotRandomSeed (Random.int Random.minInt Random.maxInt)
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotRandomSeed seed ->
            ( { model | randomSeed = Just (Random.initialSeed seed) }, Cmd.none )


view : Shell.ViewProps msg -> Model -> Browser.Document msg
view props model =
    Shell.render props "2025 Demos" [
        case model.randomSeed of
            Nothing ->
                p "Loading..."
            Just seed ->
                if List.isEmpty allVideos then
                    p "Coming soon!"
                else
                    renderVideoGallery (shuffledVideoUrls seed)
    ]


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-static/blob/main/2025/demos/" ++ filename ++ "?raw=true"


shuffledVideoUrls : Random.Seed -> List VideoInfo
shuffledVideoUrls seed =
    Random.step (Random.List.shuffle allVideos) seed
        |> Tuple.first
        |> List.map (\v -> { v | url = toUrl v.url })


allVideos : List VideoInfo
allVideos =
    [
        { title = "Team 5: Net Reaper", url = "team5.mov" }
        , { title = "Team 21: RPGain", url = "team21.mp4" }
    ]
