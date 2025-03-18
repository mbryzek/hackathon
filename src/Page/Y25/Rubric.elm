-- codegen.global.state: GlobalStateAnonymousData
module Page.Y25.Rubric exposing (view)

import Browser
import Html exposing (Html, text)
import Html.Attributes exposing (class)
import Templates.Shell as Shell
import Ui.Elements exposing (p)


view : Shell.ViewProps mainMsg -> Browser.Document mainMsg
view shellProps =
    Shell.render shellProps "2025 Rubric" [ contents ]


contents : Html mainMsg
contents =
    Html.div [ class "flex flex-col gap-y-8" ]
        [ p "This year's evaluation format will be similar to a science fair. Towards the end of the evening, all teams will stop working on their projects and shift to presenting their projects to the audience. Judges, parents, and students are encouraged to visit each project to see what other teams have built."
        , p "During this period, judges will evaluate each team's work against the rubric below. As we announce the prizes, we'll invite the first place team in each theme to demo their work for the full audience."
        , p "The maximum score from a single judge is 8 points (4 points each for Execution and Ambition). Each team's final score will be averaged across all judges. Judges with children on a team will be excused from evaluating that team."
        , p "The criteria are intended to be applied equally to all teams - team backgrounds and skill levels should not influence scoring."
        , Html.div [ class "grid grid-cols-1 md:grid-cols-2 gap-8" ]
            [ rubricSection "Execution" executionRubric
            , rubricSection "Ambition" ambitionRubric
            ]
        ]


rubricSection : String -> List ( Int, String ) -> Html mainMsg
rubricSection title items =
    Html.div [ class "rounded-lg border border-gray-200 overflow-hidden" ]
        [ Html.div
            [ class "bg-gray-100 px-6 py-4 border-b border-gray-200" ]
            [ Html.h3 [ class "text-lg font-semibold text-yellow-600" ] [ text title ] ]
        , Html.div
            [ class "px-6 py-4" ]
            [ Html.div
                [ class "flex flex-col gap-y-4" ]
                (List.map rubricRow items)
            ]
        ]


rubricRow : ( Int, String ) -> Html mainMsg
rubricRow ( score, description ) =
    Html.div [ class "flex gap-x-4" ]
        [ Html.div [ class "font-bold min-w-[2rem] text-yellow-600" ] [ text (String.fromInt score) ]
        , Html.div [] [ text description ]
        ]


executionRubric : List ( Int, String )
executionRubric =
    [ ( 4, "Flawless Execution - The project is fully functional, stable, and free of major bugs. Performance is smooth, and all intended features work as expected. The team has handled edge cases and ensured robustness." )
    , ( 3, "Solid Execution - The project is mostly functional, with minor bugs or missing features. Performance is acceptable, but some refinements could improve usability. Some edge cases may not be handled." )
    , ( 2, "Partial Execution - The project works in some cases but has noticeable bugs, crashes, or incomplete features. Some core functionality may be missing, but the concept is demonstrated." )
    , ( 1, "Minimal Execution - The project barely works or is incomplete. Most features are non-functional, and the team struggled to implement their ideas." )
    , ( 0, "Non-functional - The project does not run or function at all." )
    ]


ambitionRubric : List ( Int, String )
ambitionRubric =
    [ ( 4, "World-Changing Innovation - The project aims to solve a significant problem in a novel way. It pushes the boundaries of technology or creates something entirely new. The team tackled a highly ambitious idea." )
    , ( 3, "Impressive Challenge - The project demonstrates a unique or difficult technical challenge. It is innovative and requires a high level of skill, but it may not be groundbreaking." )
    , ( 2, "Moderate Challenge - The project is useful and well-scoped but does not push beyond common applications. The team took on a reasonable challenge with some creative elements." )
    , ( 1, "Trivial Application - The project is simple. It might be functional but lacks novelty or difficulty." )
    , ( 0, "No Ambition - The project does not show any effort toward solving a real problem or attempting a challenge." )
    ]
