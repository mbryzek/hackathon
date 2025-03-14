module Page.Index exposing (Msg, update, view)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState, MainViewProps)
import Html exposing (Html, img, text)
import Html.Attributes exposing (class, src)
import Templates.Shell as Shell
import Ui.Elements exposing (calloutBox2, button, p, textColor)
import Urls


type Msg
    = RedirectTo String


update : GlobalState -> Msg -> Cmd Msg
update global msg =
    case msg of
        RedirectTo url ->
            Nav.pushUrl global.navKey url


view : MainViewProps Msg mainMsg -> Shell.ViewProps mainMsg -> Browser.Document mainMsg
view { msgMap } shellProps =
    Shell.render shellProps "2025 Bergen Tech Hackathon" [ contents |> Html.map msgMap ]

contents : Html Msg
contents =
    Html.div [class "flex flex-col gap-y-4"] [
        calloutBox2
            { title = "Date & Time"
            , contents = twoLines "April 5, 2025" "9am - 9pm"
            }
            { title = "Location"
            , contents = twoLines "Bergen Tech High School" "Teterboro NJ"
            }
        , p "The Bergen Tech Computer Science Parents group is very pleased to announce the second annual Computer Science Hackathon in collaboration with the BT Code Club and Computer Science Major. This event is an amazing opportunity for our students to have fun, learn and build software together. "
        , p "This hackathon is a great opportunity for students of all levels to learn and explore their passion for software. Students, in teams of 1-4, will have 12 hours to build a project of their choosing and have a change to compete in over 10 categories for awards of over $5,000!"
        , p "We need your help! To make this event a huge success, we're seeking donations from individuals and companies interested in sponsoring the event. All donations are tax deductible and 100% of the funds raised directly support this event. "
        , p "This even is open to students of Bergen Tech at the Teterboro and Paramus campuses."
        , p "Every contribution, big or small, makes a difference. Let's come together to inspire and nurture the next generation of tech wizards at Bergen Tech! "
        , button (RedirectTo Urls.donate) "Donate or Become a Sponsor"
        , thankYouMessage
        , studentPhoto
    ]


thankYouMessage : Html Msg
thankYouMessage =
    Html.p [ class (textColor ++ " font-semibold text-center italic mt-8") ]
        [ text " Thank you for being a part of our community's growth and innovation! ❤️ " ]


studentPhoto : Html Msg
studentPhoto =
    img [ src "https://github.com/mbryzek/hackathon-photos/blob/main/2024/all-students.jpg?raw=true" ] []

twoLines : String -> String -> Html Msg
twoLines first second =
    Html.div [ class "flex flex-col gap-y-2" ]
        [ Html.div [] [ Html.text first ]
        , Html.div [] [ Html.text second ]
        ]
