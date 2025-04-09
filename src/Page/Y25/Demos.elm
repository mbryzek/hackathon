-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Demos exposing (Model, Msg, init, update, view)

import Browser
import Templates.VideoGallery exposing (renderVideoGallery)
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
    Shell.render props "2025 Videos" [
        if List.isEmpty allVideos then
            p "Coming soon!"
        else
            renderVideoGallery (shuffledVideoUrls model.randomSeed)
    ]


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-static/blob/main/2025/demos/" ++ filename ++ "?raw=true"


shuffledVideoUrls : Random.Seed -> List String
shuffledVideoUrls seed =
    Random.step (Random.List.shuffle (List.map (\v -> toUrl v.url) allVideos)) seed
        |> Tuple.first

type alias Video =
    { title : String
    , url : String
    }

allVideos : List Video
allVideos =
    [
        { title = "Team 5", url = "team5.mov" }
        , { title = "Team 21", url = "team21.mp4" }
    ]
