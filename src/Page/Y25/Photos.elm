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
    "https://github.com/mbryzek/hackathon-static/blob/main/2025/ambiance/" ++ filename ++ "?raw=true"


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
        "IMG_8866.w640.JPG",
        "Hackathon Group.w640.jpg",
        "IMG_3997.w640.JPG",
        "IMG_4130.w640.JPG",
        "IMG_8777.w640.JPG",
        "IMG__4059.w640.JPG",
        "IMG_3562.w640.JPG",
        "IMG_3999.w640.JPG",
        "IMG_4179.w640.JPG",
        "IMG_8784.w640.JPG",
        "IMG__4079.w640.JPG",
        "IMG_3566.w640.JPG",
        "IMG_4005.w640.JPG",
        "IMG_4219.w640.JPG",
        "IMG_8789.w640.JPG",
        "IMG__4092.w640.JPG",
        "IMG_3569.w640.JPG",
        "IMG_4017.w640.JPG",
        "IMG_4249.w640.JPG",
        "IMG_8797.w640.JPG",
        "IMG__4094.w640.JPG",
        "IMG_3608.w640.JPG",
        "IMG_4046.w640.JPG",
        "IMG_4287.w640.JPG",
        "IMG_8803.w640.JPG",
        "IMG__4108.w640.JPG",
        "IMG_3639.w640.JPG",
        "IMG_4052.w640.JPG",
        "IMG_4348.w640.JPG",
        "IMG_8809.w640.JPG",
        "IMG__4118.w640.JPG",
        "IMG_3650.w640.JPG",
        "IMG_4059.w640.JPG",
        "IMG_8706.w640.JPG",
        "IMG_8813.w640.JPG",
        "IMG__4127.w640.JPG",
        "IMG_3669.w640.JPG",
        "IMG_4061.w640.JPG",
        "IMG_8714.w640.jpg",
        "IMG_8818.w640.JPG",
        "IMG__4129.w640.JPG",
        "IMG_3670.w640.JPG",
        "IMG_4071.w640.JPG",
        "IMG_8728.w640.JPG",
        "IMG_8825.w640.JPG",
        "IMG__4131.w640.JPG",
        "IMG_3693.w640.JPG",
        "IMG_4094.w640.JPG",
        "IMG_8752.w640.JPG",
        "IMG_8826.w640.JPG",
        "IMG__4138.w640.JPG",
        "IMG_3701.w640.JPG",
        "IMG_4099.w640.JPG",
        "IMG_8753.w640.JPG",
        "IMG_8829.w640.JPG",
        "IMG__4141.w640.JPG",
        "IMG_3731.w640.JPG",
        "IMG_4101.w640.JPG",
        "IMG_8754.w640.JPG",
        "IMG_8831.w640.JPG",
        "IMG__4146.w640.JPG",
        "IMG_3812.w640.JPG",
        "IMG_4104.w640.JPG",
        "IMG_8755.w640.JPG",
        "IMG_8832.w640.JPG",
        "IMG__4148.w640.JPG",
        "IMG_3847.w640.JPG",
        "IMG_4106.w640.JPG",
        "IMG_8756.w640.JPG",
        "IMG_8833.w640.JPG",
        "IMG__4165.w640.JPG",
        "IMG_3857.w640.JPG",
        "IMG_4108.w640.JPG",
        "IMG_8757.w640.JPG",
        "IMG_8838.w640.JPG",
        "IMG__4187.w640.JPG",
        "IMG_3892.w640.JPG",
        "IMG_4111.w640.JPG",
        "IMG_8758.w640.JPG",
        "IMG_8849.w640.JPG",
        "IMG__4191.w640.JPG",
        "IMG_3914.w640.JPG",
        "IMG_4113 2.w640.JPG",
        "IMG_8759.w640.JPG",
        "IMG_8850.w640.JPG",
        "IMG__4220.w640.JPG",
        "IMG_3921.w640.JPG",
        "IMG_4116.w640.JPG",
        "IMG_8760.w640.JPG",
        "IMG_8851.w640.JPG",
        "IMG__4224.w640.JPG",
        "IMG_3924.w640.JPG",
        "IMG_4118.w640.JPG",
        "IMG_8761.w640.JPG",
        "IMG_8852.w640.JPG",
        "IMG__4229.w640.JPG",
        "IMG_3934.w640.JPG",
        "IMG_4122.w640.JPG",
        "IMG_8762.w640.JPG",
        "IMG_8857.w640.JPG",
        "everybody-all.w640.JPG",
        "IMG_3946.w640.JPG",
        "IMG_4124.w640.jpg",
        "IMG_8764.w640.JPG",
        "IMG_8859.w640.JPG",
        "everybody-fun.w640.JPG",
        "IMG_3950.w640.JPG",
        "IMG_4125.w640.JPG",
        "IMG_8765.w640.JPG",
        "IMG_8860.w640.JPG",
        "IMG_3964.w640.JPG",
        "IMG_4127.w640.JPG",
        "IMG_8772.w640.JPG",
        "IMG_8865.w640.JPG",
        "IMG_3993 2.w640.JPG",
        "IMG_4129.w640.JPG",
        "IMG_8776.w640.JPG",
        "IMG_8866.w640.JPG"
    ]
