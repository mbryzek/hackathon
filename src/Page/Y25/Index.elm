-- codegen.global.state: GlobalStateAnonymousData


module Page.Y25.Index exposing (view)

import Browser
import Html exposing (Html, div, h2, h3, img, li, ul)
import Html.Attributes exposing (class, src)
import Templates.Shell as Shell
import Ui.Elements exposing (calloutBox2, p, textDiv, twoLines)


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props
        "2025 Hackathon Event Summary"
        [ textDiv
            [ calloutBox2
                { title = "Date & Time"
                , contents = twoLines "April 5, 2025" "9am - 9pm"
                }
                { title = "Location"
                , contents = twoLines "Bergen Tech High School" "Teterboro NJ"
                }
            , p "The 2025 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your support and share a few highlights from the day - we could not have put this event together without you!"
            -- , div [ class "mt-4" ] [ a [ class "hover:underline", href "https://drive.google.com/file/d/1wOa76kLDIPP24XWYF1qtEaPvSoOZp7R3/view?usp=sharing" ] [ p "Download our 2025 event summary here" ] ]
            , p "This year the event doubled in size with 102 high school students registering from both the Teterboro and Paramus campuses. These students formed 30 teams to compete in the 12-hour coding event. From idea generation to building their apps and projects to final demos, the students impressed everyone involved."
            , div [ class "mt-4 pl-4" ]
                [ h3 [ class "text-xl font-semibold mb-2" ] [ p "Projects" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [ class "pl-2" ] [ p "A Chrome Extension to help you detect phishing, attacks directly in your browser" ]
                    , li [ class "pl-2" ] [ p "An app to generate a bracket for your upcoming sports tournament" ]
                    , li [ class "pl-2" ] [ p "A robotic grid to detect cars at intersections and to optimize traffic lights for maximum flow" ]
                    , li [ class "pl-2" ] [ p "An AI to help you find new albums based on your listening preferences" ]
                    , li [ class "pl-2" ] [ p "A two sided app to help Alzheimer's patients and their caregivers connect more with their family and friends" ]
                    , li [ class "pl-2" ] [ p "An emergency services dispatch tool ensuring people get help even in remote areas" ]
                    , li [ class "pl-2" ] [ p "A vacation planner to help you optimize for fun and budget" ]
                    , li [ class "pl-2" ] [ p "A physics tutor - automatically building summaries, practice problems, and more based on your textbook, all locally trained" ]
                    , li [ class "pl-2" ] [ p "An IOT network scanner to find vulnerabilities in your home" ]
                    , li [ class "pl-2" ] [ p "An app to translate sign language to text" ]
                    , li [ class "pl-2" ] [ p "A game to motivate you to exercise and stay fit" ]
                    , li [ class "pl-2" ] [ p "and much more!" ]
                    ]
                ]
            , div [ class "mt-4 pl-4" ]
                [ h2 [ class "text-2xl font-semibold mb-2" ] [ p "By the Numbers" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [ class "pl-2" ] [ p "100+ students" ]
                    , li [ class "pl-2" ] [ p "30 teams" ]
                    , li [ class "pl-2" ] [ p "12 awards" ]
                    , li [ class "pl-2" ] [ p "!$5k in prizes" ]
                    , li [ class "pl-2" ] [ p "8 sponsors" ]
                    , li [ class "pl-2" ] [ p "~50 donors" ]
                    , li [ class "pl-2" ] [ p "~20 volunteers" ]
                    , li [ class "pl-2" ] [ p "3 industry speakers" ]
                    ]
                , studentPhoto
                ]
            ]
        ]


studentPhoto : Html msg
studentPhoto =
    img
        [ class "mt-4"
        , src "https://github.com/mbryzek/hackathon-photos/blob/main/2025/everybody.w640.jpg?raw=true"
        ]
        []
