-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Index exposing (view)

import Browser
import Html exposing (Html, a, div, h2, h3, img, li, ul)
import Html.Attributes exposing (class, href, src)
import Templates.Shell as Shell
import Ui.Elements exposing (p, textDiv)

view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props "2025 Hackathon Event Summary" [
        textDiv
            [ p "The inaugural 2024 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your support and share a few highlights from the day - we could not have put this event together without you!"
            , div [ class "mt-4" ] [ a [ class "hover:underline", href "https://drive.google.com/file/d/1wOa76kLDIPP24XWYF1qtEaPvSoOZp7R3/view?usp=sharing" ] [ p "Download our 2024 event summary here" ] ]
            , p "52 students from grades 9-12 competed in a 12-hour coding event. From idea generation to building their apps and projects to final presentations, the students impressed everyone involved."
            , div [ class "mt-4 pl-4" ]
                [ h3 [ class "text-xl font-semibold mb-2" ] [ p "Projects" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [ class "pl-2" ] [ p "AI Recipe Generator: Enter ingredients to get tailored recipes using AI." ]
                    , li [ class "pl-2" ] [ p "Disease Identifier: Identifies diseases based on symptoms with AI assistance." ]
                    , li [ class "pl-2" ] [ p "Competition Platform: An end-to-end platform for creating and hosting events." ]
                    , li [ class "pl-2" ] [ p "Drawing Game: A browser-based recreation of Microsoft Paint." ]
                    , li [ class "pl-2" ] [ p "Carbon Movement Tracker: Tracks carbon emissions based on transportation mode." ]
                    , li [ class "pl-2" ] [ p "Spotify Mood Playlist: Generates Spotify playlists based on mood using AI." ]
                    , li [ class "pl-2" ] [ p "Find Your Lost Dog: A drone algorithm to locate lost pets efficiently." ]
                    ]
                ]
            , div [ class "mt-4 pl-4" ]
                [ h2 [ class "text-2xl font-semibold mb-2" ] [ p "By the Numbers" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [ class "pl-2" ] [ p "52 student participants" ]
                    , li [ class "pl-2" ] [ p "18 teams" ]
                    , li [ class "pl-2" ] [ p "10 awards" ]
                    , li [ class "pl-2" ] [ p "$5,730 in prizes" ]
                    , li [ class "pl-2" ] [ p "8 sponsors" ]
                    , li [ class "pl-2" ] [ p "~50 donors" ]
                    , li [ class "pl-2" ] [ p "~20 volunteers" ]
                    , li [ class "pl-2" ] [ p "5 industry speakers" ]
                    ]
                , studentPhoto
                ]
            ]
    ]


studentPhoto : Html msg
studentPhoto =
    img
        [ class "mt-4"
        , src "https://github.com/mbryzek/hackathon-photos/blob/main/2024/jumping.jpg?raw=true"
        ]
        []
