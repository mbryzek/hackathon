module Page.Y24.Summary exposing (Model, Msg, init, update, view)

import Global exposing (GlobalState)
import Html exposing (Html, div, h1, h2, h3, p, ul, li, text)
import Html.Attributes exposing (class)

type alias Model =
    { global: GlobalState }

type Msg = NoOp

init : GlobalState -> Model
init global =
    { global = global }

update : Msg -> Model -> ( Model, Cmd Msg )
update _ model =
    ( model, Cmd.none )

view : Model -> Html msg
view _ =
    div [ class "p-8 max-w-3xl mx-auto" ]
        [ h1 [ class "text-3xl font-bold text-center mb-8" ] [ text "BTCSP 2024 Hackathon Event Summary" ]
        , div [ class "mb-6" ]
            [ p [ class "text-lg" ]
                [ text "The inaugural 2024 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your support and share a few highlights from the day - we could not have put this event together without you!" ]
            ]
        , div [ class "mb-6" ]
            [ h2 [ class "text-2xl font-semibold mb-2" ] [ text "Event Highlights" ]
            , p [ class "text-lg" ]
                [ text "52 students from grades 9-12 competed in a 12-hour coding event. From idea generation to building their apps and projects to final presentations, the students impressed everyone involved." ]
            ]
        , div [ class "mb-6" ]
            [ h3 [ class "text-xl font-semibold mb-2" ] [ text "Projects" ]
            , ul [ class "list-disc pl-6 space-y-2" ]
                [ li [] [ text "AI Recipe Generator: Enter ingredients to get tailored recipes using AI." ]
                , li [] [ text "Disease Identifier: Identifies diseases based on symptoms with AI assistance." ]
                , li [] [ text "Competition Platform: An end-to-end platform for creating and hosting events." ]
                , li [] [ text "Drawing Game: A browser-based recreation of Microsoft Paint." ]
                , li [] [ text "Carbon Movement Tracker: Tracks carbon emissions based on transportation mode." ]
                , li [] [ text "Spotify Mood Playlist: Generates Spotify playlists based on mood using AI." ]
                , li [] [ text "Find Your Lost Dog: A drone algorithm to locate lost pets efficiently." ]
                ]
            ]
        , div [ class "mb-6" ]
            [ h2 [ class "text-2xl font-semibold mb-2" ] [ text "By the Numbers" ]
            , ul [ class "list-disc pl-6 space-y-2" ]
                [ li [] [ text "52 student participants" ]
                , li [] [ text "18 teams" ]
                , li [] [ text "10 awards" ]
                , li [] [ text "$5,730 in prizes" ]
                , li [] [ text "8 sponsors" ]
                , li [] [ text "~50 donors" ]
                , li [] [ text "~20 volunteers" ]
                , li [] [ text "5 industry speakers" ]
                ]
            ]
        ]
