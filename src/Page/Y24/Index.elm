module Page.Y24.Index exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div, ul, li, h2, h3)
import Html.Attributes exposing (class)
import Templates.Shell exposing (renderShell)
import Ui.Elements exposing (p, textDiv)
import Ui.Elements exposing (calloutBox2)

type alias Model =
    { global: GlobalState }

type Msg = NoOp

init : GlobalState -> Model
init global =
    { global = global }

update : Msg -> Model -> ( Model, Cmd Msg )
update _ model =
    ( model, Cmd.none )

view : Model -> Html Msg
view _ =
    renderShell { title = "2024 Hackathon Event Summary" } [ summary ]

summary : Html msg
summary =
    textDiv [
        p "The inaugural 2024 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your support and share a few highlights from the day - we could not have put this event together without you!" 
        , p "52 students from grades 9-12 competed in a 12-hour coding event. From idea generation to building their apps and projects to final presentations, the students impressed everyone involved."
        , div [ class "mt-4 pl-4" ]
            [ h3 [ class "text-xl font-semibold mb-2" ] [ p "Projects" ]
            , ul [ class "list-disc pl-6 space-y-2" ]
                [ li [class "pl-2"] [ p "AI Recipe Generator: Enter ingredients to get tailored recipes using AI." ]
                , li [class "pl-2"] [ p "Disease Identifier: Identifies diseases based on symptoms with AI assistance." ]
                , li [class "pl-2"] [ p "Competition Platform: An end-to-end platform for creating and hosting events." ]
                , li [class "pl-2"] [ p "Drawing Game: A browser-based recreation of Microsoft Paint." ]
                , li [class "pl-2"] [ p "Carbon Movement Tracker: Tracks carbon emissions based on transportation mode." ]
                , li [class "pl-2"] [ p "Spotify Mood Playlist: Generates Spotify playlists based on mood using AI." ]
                , li [class "pl-2"] [ p "Find Your Lost Dog: A drone algorithm to locate lost pets efficiently." ]
                ]
            ]
        , div [ class "mt-4 pl-4" ]
            [ h2 [ class "text-2xl font-semibold mb-2" ] [ p "By the Numbers" ]
            , ul [ class "list-disc pl-6 space-y-2" ]
                [ li [class "pl-2"] [ p "52 student participants" ]
                , li [class "pl-2"] [ p "18 teams" ]
                , li [class "pl-2"] [ p "10 awards" ]
                , li [class "pl-2"] [ p "$5,730 in prizes" ]
                , li [class "pl-2"] [ p "8 sponsors" ]
                , li [class "pl-2"] [ p "~50 donors" ]
                , li [class "pl-2"] [ p "~20 volunteers" ]
                , li [class "pl-2"] [ p "5 industry speakers" ]
                ]
            ]
        ]
