module Constants exposing (logoImg)

import Html exposing (Html, img)
import Html.Attributes exposing (src, height)

logoImg : Html msg
logoImg =
  img [ src "https://raw.githubusercontent.com/mbryzek/hackathon/refs/heads/main/assets/bt-cs-logo.png"
        , height 150
      ] []
