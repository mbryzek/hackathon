module Constants exposing (logoImg, logoSrc)

import Html exposing (Html, img)
import Html.Attributes exposing (src, height)

logoSrc : String
logoSrc =
  "https://raw.githubusercontent.com/mbryzek/hackathon/refs/heads/main/assets/bt-cs-logo.png"

logoImg : Html msg
logoImg =
  img [ src logoSrc, height 150 ] []
