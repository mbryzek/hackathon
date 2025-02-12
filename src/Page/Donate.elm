module Page.Donate exposing (view)

import Global exposing (GlobalState)
import Html exposing (Html, div, h2, h3, li, ul)
import Html.Attributes exposing (class)
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (callToAction, p, textDiv)
import Urls


type alias Model =
    { global : GlobalState
    , shell : ShellTemplate.Model }


type msg =
    ShellTemplatemsg ShellTemplate.Shellmsg


init : ( Model, Cmd msg )
init global =
    let
        ( shell, shellCmd ) =
            
    in
    ( { global = global
      , shell = shell
      }
    , Cmd.map ShellTemplatemsg shellCmd
    )


update : msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        ShellTemplatemsg submsg ->
            let
                ( updatedShell, shellCmd ) =
                    ShellTemplate.update submsg model.shell
            in
            ( { model | shell = updatedShell }, Cmd.map ShellTemplatemsg shellCmd )


view : GlobalState -> Html msg
view global =
    renderShell model.shell ShellTemplatemsg {
        title = "Support the Hackathon", url = Just Urls.donate
    }
        [ textDiv
            [ p "The Bergen Tech Hackathon is only possible thanks to the generosity of our sponsors and donors. If you would like to support our mission of empowering the next generation of tech leaders, please consider donating to our cause."
            , p "Thank you for your support!"
            , individualDonors
            , corporateSponsors
            , p "Bergen Youth Enrichment is a registered 501(c)(3) public charity. All donations are tax deductible."
            ]
        ]


individualDonors : Html msg
individualDonors =
    div []
        [ h2 [ class "text-2xl font-bold mb-4" ] [ Html.text "Individual Donors" ]
        , p "Every contribution, big or small, makes a difference. Let's come together to inspire and nurture the next generation of tech wizards at Bergen Tech!"
        , p "We are also looking for donations for the event and raffle - eg. food, drink, and small prizes that the students will enjoy. Last year's raffle included gift certificates to local restaurants, subscriptions to online coding platforms, and more."
        , callToAction "https://donorbox.org/2025-bt-computer-science-hackathon" "Donate here"
        ]


corporateSponsors : Html msg
corporateSponsors =
    div []
        [ h2 [ class "text-2xl font-bold mt-8 mb-4" ] [ Html.text "Corporate Sponsorship Levels" ]
        , callToAction "https://drive.google.com/file/d/1LqjB9SEQnjghTK6R6V3aDBjtxbnZNjeb/view?usp=sharing" "Download Sponsorship Package"
        , div [class "mt-4"] [
            ul [ class "space-y-6" ]
                [ sponsorshipTier "Headline Sponsor"
                    "$5,000"
                    [ "All Platinum tier benefits plus"
                    , "Exclusive: Only 1 headline sponsor for the entire event"
                    , "Offical \"sponsored by\" on all event branding"
                    , "Option to speak at the event"
                    ]
                , sponsorshipTier "Platinum Sponsor"
                    "$2,000"
                    [ "All Gold tier benefits plus"
                    , "Option to join the judging panel"
                    , "Large logo placement on event T-shirts"
                    , "Large banner in event space"
                    ]
                , sponsorshipTier "Gold Sponsor"
                    "$1,000"
                    [ "All Silver tier benefits plus"
                    , "Placement of merchandise/content in Goodie Bag"
                    ]
                , sponsorshipTier "Silver Sponsor"
                    "$500"
                    [ "Logo placement on event T-Shirt"
                    ]
                ]
            ]
        , callToAction "https://donorbox.org/events/680776" "Become a sponsor here"
        ]


sponsorshipTier : String -> String -> List String -> Html msg
sponsorshipTier name cost benefits =
    li [ class "border-l-4 border-yellow-500 pl-4" ]
        [ div [ class "flex gap-x-4" ]
            [ div [] [ h3 [ class "text-xl font-semibold" ] [ Html.text name ] ]
            , div [ class "text-lg font-semibold" ] [ Html.text cost ]
            ]
        , ul [ class "pl-4 list-disc list-inside" ] (List.map p benefits)
        ]
