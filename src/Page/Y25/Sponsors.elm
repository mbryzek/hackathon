-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Sponsors exposing (view)

import Browser
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell as Shell
import Ui.Elements exposing (p)


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props "2025 Sponsors" [
        p "A huge thank you to our sponsors who made our 2025 Hackathon possible!"
        , renderPhotoGallery logos
    ]


toUrl : String -> String
toUrl filename =
    "https://github.com/mbryzek/hackathon-photos/blob/main/2025/sponsors/" ++ filename ++ "?raw=true"


logos : List String
logos =
    List.map toUrl
        [ "mek-review.png"
        , "costco.jpg"
        , "carbon-sustain.png"
        , "catalano.jpg"
        , "francesca.jpg"
        , "sunrise.png"
        , "west-clinton.jpg"
        , "pan.jpg"
        , "bryzek.jpg"
        ]