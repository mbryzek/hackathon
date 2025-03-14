module Page.Y25.Prizes exposing (view)

import Browser
import Global exposing (MainViewProps)
import Html exposing (Html, img, text)
import Html.Attributes exposing (class, src)
import Templates.Shell as Shell
import Ui.Elements exposing (calloutBox2, button, p, textColor)
import Urls

view : Shell.ViewProps mainMsg -> Browser.Document mainMsg
view shellProps =
    Shell.render shellProps "2025 Prizes" [ contents ]

contents : Html mainMsg
contents =
    Html.div [ class "flex flex-col gap-y-8" ] [
        -- Introduction
        p "This year we are trying a new format for the awards - there will still be a ton of cash prizes across two broad themes and specific individual awards. As teams register, they must indicate their theme and any individual awards for which the team would like to be considered."

        -- Overall Prizes Section
        , Html.div [ class "bg-white rounded-lg shadow-md p-6" ]
            [ Html.h2 [ class "text-2xl font-bold mb-4" ] [ text "Overall Awards" ]
            , Html.div [ class "flex flex-col gap-y-4" ] [
                prizeEntry "1st Place" "$1,000 Cash" "Highest # of points in judging criteria. Any ties are broken by the judges."
                , prizeEntry "2nd Place" "$500 Cash" "2nd highest # of points based on judging criteria. Any ties are broken by the judges."
                , prizeEntry "3rd Place" "$250 Cash" "3rd highest # of points based on judging criteria. Any ties are broken by the judges."
            ]
            ]

        -- Additional Awards Section
        , Html.div [ class "bg-white rounded-lg shadow-md p-6" ]
            [ Html.h2 [ class "text-2xl font-bold mb-4" ] [ text "Additional Awards" ]
            , Html.div [ class "flex flex-col gap-y-4" ] [
                prizeEntry "Best Mobile Application" "$500 Cash" "Awarded to the team with the highest # of points that has built a native mobile application (android or iOs)."
                , prizeEntry "Freshman Prize" "$250 Cash" "Awarded to the team with the highest # of points with all members in their first year of high school."
                , prizeEntry "Cybersecurity" "$250 Cash" "An application built to directly improve cyber security in some way. This criterion will be independently evaluated by the judges."
                , prizeEntry "New Coder Prize" "$250 Cash" "Awarded to the team with the highest # of points with all members as New Coders. A new coder is somebody to have less than 1 year experience with any type of coding."
                , prizeEntry "Best use of Artificial Intelligence" "$250 Cash" "Awarded to the team that presents the most interesting / novel use of a large language model. This criterion will be independently evaluated by the judges."
                , prizeEntry "Best Device (Robotics / Arduino / etc.)" "$250 Cash" "The idea here is to encourage students to build robotic, arduino, etc devices / products"
                , prizeEntry "Best Visual Design" "$250 Cash" "Awarded to the team that presents the most engaging Visual Design. This criterion will be independently evaluated by the judges."
                , prizeEntry "Student's Choice Award" "$250 Cash" "Students will each submit a single vote for which team they think should win - The team with the most votes will earn the Student Choice award. For this award, ties will split the prize."
                , prizeEntry "Parent's Choice Award" "$250 Cash" "Attending parents will each submit a single vote for which team they think should win - The team with the most votes will earn the Student Choice award. For this award, ties will split the prize."
            ]
            ]
    ]

prizeEntry : String -> String -> String -> Html msg
prizeEntry title amount description =
    Html.div [ class "border-l-4 border-yellow-500 pl-4" ] [
        Html.div [ class "flex items-baseline gap-x-2" ] [
            Html.h3 [ class "text-xl font-bold text-yellow-600" ] [ text title ]
            , Html.span [ class "text-lg font-semibold text-green-600" ] [ text amount ]
        ]
        , p description
    ]
