module Page.Index exposing (Model, Msg, init, update, view)

import Browser.Navigation as Nav
import Global exposing (GlobalState)
import Html exposing (Html, img, text)
import Html.Attributes exposing (class, src)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (calloutBox2, link, p, textColor, textDiv)
import Urls


type alias Model =
    { global : GlobalState
    , shell : ShellTemplate.Model
    }


type Msg
    = ShellTemplateMsg ShellTemplate.ShellMsg
    | RedirectTo String


init : GlobalState -> ( Model, Cmd Msg )
init global =
    let
        ( shell, shellCmd ) =
            ShellTemplate.init
    in
    ( { global = global
      , shell = shell
      }
    , Cmd.map ShellTemplateMsg shellCmd
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShellTemplateMsg subMsg ->
            let
                ( updatedShell, shellCmd ) =
                    ShellTemplate.update subMsg model.shell
            in
            ( { model | shell = updatedShell }, Cmd.map ShellTemplateMsg shellCmd )

        RedirectTo url ->
            ( model, Nav.pushUrl model.global.navKey url )


twoLines : String -> String -> Html msg
twoLines first second =
    Html.div [ class "flex flex-col gap-y-2" ]
        [ Html.div [] [ Html.text first ]
        , Html.div [] [ Html.text second ]
        ]


view : Model -> Html Msg
view model =
    renderShell model.shell
        ShellTemplateMsg
        { title = "2025 Bergen Tech Hackathon"
        , url = Just Urls.index
        }
        [ textDiv
            [ calloutBox2
                { title = "Date & Time"
                , contents = twoLines "April 6, 2025" "9am - 9pm"
                }
                { title = "Location"
                , contents = twoLines "Bergen Tech High School" "Teterboro NJ"
                }
            , p "The Bergen Tech Computer Science Parents group is very pleased to announce the second annual Computer Science Hackathon in collaboration with the BT Code Club and Computer Science Major. This event is an amazing opportunity for our students to have fun, learn and build software together. "
            , p "This hackathon is a great opportunity for students of all levels to learn and explore their passion for software. Students, in teams of 1-4, will have 12 hours to build a project of their choosing and have a change to compete in over 10 categories for awards of over $5,000!"
            , p "We need your help! To make this event a huge success, we're seeking donations from individuals and companies interested in sponsoring the event. All donations are tax deductible and 100% of the funds raised directly support this event. "
            , p "This even is open to students of Bergen Tech at the Teterboro and Paramus campuses."
            , p "Every contribution, big or small, makes a difference. Let's come together to inspire and nurture the next generation of tech wizards at Bergen Tech! "
            , link (RedirectTo Urls.donate) "Donate or Become a Sponsor"
            , thankYouMessage
            , studentPhoto
            ]
        ]


thankYouMessage : Html Msg
thankYouMessage =
    Html.p [ class (textColor ++ " font-semibold text-center italic mt-8") ]
        [ text " Thank you for being a part of our community's growth and innovation! ❤️ " ]


studentPhoto : Html Msg
studentPhoto =
    img [ src "https://github.com/mbryzek/hackathon-photos/blob/main/2024/all-students.jpg?raw=true" ] []
