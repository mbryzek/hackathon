module Page.Y24.Sponsors exposing (view)

import Browser
import Templates.PhotoGallery exposing (renderPhotoGallery)
import Templates.Shell as Shell
import Ui.Elements exposing (p)


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props "2024 Sponsors" [
        p "A huge thank you to our sponsors who made our 2024 Hackathon possible!"
        , renderPhotoGallery logos
    ]


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