module Loading exposing (view)

import Browser
import Html exposing (Html, div)
import Templates.SimplePage as SimplePage

view : Browser.Document msg
view =
    SimplePage.render "Loading..." [contents]


contents : Html msg
contents =
    div [] []
