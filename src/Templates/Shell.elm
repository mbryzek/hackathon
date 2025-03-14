module Templates.Shell exposing (MobileMenuState, Model, ShellMsg, ViewProps, init, render, update)

import Browser
import Browser.Navigation as Nav
import Constants exposing (logoSrc)
import Global exposing (GlobalState)
import Html exposing (Html, a, button, div, h1, header, img, main_, nav, span, text)
import Html.Attributes as Attr
import Html.Events exposing (onClick)
import Svg exposing (path, svg)
import Svg.Attributes as SvgAttr
import Ui.Elements exposing (textColor)
import Url
import Urls


type alias ViewProps a =
    { global : GlobalState
    , shellModel : Model
    , onShellMsg : ShellMsg -> a
    }


type alias Model =
    { mobileMenuState : MobileMenuState
    }


type MobileMenuState
    = Open
    | Closed


type ShellMsg
    = ToggleMenu
    | RedirectTo String


init : ( Model, Cmd ShellMsg )
init =
    ( { mobileMenuState = Closed }, Cmd.none )


update : GlobalState -> ShellMsg -> Model -> ( Model, Cmd ShellMsg )
update global msg model =
    case msg of
        ToggleMenu ->
            ( { model | mobileMenuState = toggleMenuState model.mobileMenuState }, Cmd.none )

        RedirectTo url ->
            ( model, Nav.pushUrl global.navKey url )


toggleMenuState : MobileMenuState -> MobileMenuState
toggleMenuState state =
    case state of
        Open ->
            Closed

        Closed ->
            Open


type alias Section =
    { href : String, name : String }


allSections : List Section
allSections =
    [ { href = Urls.index, name = "Overview" }
    , { href = Urls.photos, name = "Photos" }
    , { href = Urls.events2024, name = "2024 Event" }
    , { href = Urls.sponsors, name = "Sponsors" }
    , { href = Urls.donate, name = "Donate" }
    , { href = Urls.contact, name = "Contact" }
    ]


topNavSections : Url.Url -> Html msg
topNavSections currentUrl =
    div
        [ Attr.class "md:block hidden" ]
        [ div
            [ Attr.class "ml-10 flex items-baseline space-x-4"
            ]
            (List.map (navLink currentUrl) allSections)
        ]


isSectionActive : Url.Url -> Section -> Bool
isSectionActive currentUrl section =
    currentUrl.path == section.href


navLink : Url.Url -> Section -> Html msg
navLink currentUrl section =
    let
        isActive : Bool
        isActive =
            isSectionActive currentUrl section
    in
    a
        [ Attr.href section.href
        , Attr.class <|
            "rounded-md px-3 py-2 text-sm font-medium "
                ++ (if isActive then
                        "bg-gray-900 text-white"

                    else
                        "text-gray-300 hover:bg-gray-700 hover:text-white"
                   )
        , if isActive then
            Attr.attribute "aria-current" "page"

          else
            Attr.class ""
        ]
        [ text section.name ]


logo : ViewProps msg -> Html msg
logo props =
    div
        [ Attr.class "shrink-0" ]
        [ img
            [ Attr.class "h-12 w-36"
            , Attr.src logoSrc
            , Attr.alt "2025 Bergen Tech Hackathon"
            , onClick (RedirectTo Urls.index)
            ]
            []
        ]
        |> Html.map props.onShellMsg


render : ViewProps msg -> String -> List (Html msg) -> Browser.Document msg
render props title contents =
    { title = title
    , body = [ renderBody props title contents ]
    }


renderBody : ViewProps msg -> String -> List (Html msg) -> Html msg
renderBody props title contents =
    div
        [ Attr.class "min-h-full"
        ]
        [ nav
            [ Attr.class "bg-gray-800"
            ]
            [ div
                [ Attr.class "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
                ]
                [ div
                    [ Attr.class "flex h-16 items-center justify-between"
                    ]
                    [ div
                        [ Attr.class "flex items-center"
                        ]
                        [ logo props
                        , topNavSections props.global.url
                        ]
                    , mobileMenuButton props.shellModel props
                    ]
                ]
            ]
        , header
            [ Attr.class "bg-white shadow-sm"
            ]
            [ div
                [ Attr.class "mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
                ]
                [ h1
                    [ Attr.class (textColor ++ " text-lg/6 font-semibold")
                    ]
                    [ text title ]
                ]
            ]
        , main_ []
            [ div
                [ Attr.class "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                ]
                contents
            ]
        ]


createSvg : String -> Html ShellMsg
createSvg d =
    svg
        [ SvgAttr.class "block h-6 w-6"
        , SvgAttr.fill "none"
        , SvgAttr.viewBox "0 0 24 24"
        , SvgAttr.strokeWidth "1.5"
        , SvgAttr.stroke "currentColor"
        , Attr.attribute "aria-hidden" "true"
        , Attr.attribute "data-slot" "icon"
        , onClick ToggleMenu
        ]
        [ path
            [ SvgAttr.strokeLinecap "round"
            , SvgAttr.strokeLinejoin "round"
            , SvgAttr.d d
            ]
            []
        ]


hamburgerMenuIcon : Html ShellMsg
hamburgerMenuIcon =
    createSvg "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"


closeIcon : Html ShellMsg
closeIcon =
    createSvg "M6 18 18 6M6 6l12 12"


srOnly : String -> Html msg
srOnly text =
    span [ Attr.class "sr-only" ] [ Html.text text ]


mobileMenuButton : Model -> ViewProps msg -> Html msg
mobileMenuButton model props =
    let
        contents : Html ShellMsg
        contents =
            div
                [ Attr.class "absolute right-0 top-full mt-2 w-48 bg-gray-800 shadow-lg rounded-md" ]
                [ div
                    [ Attr.class "space-y-1 px-2 py-2" ]
                    (List.map
                        (\section ->
                            a
                                [ Attr.href section.href
                                , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                                ]
                                [ text section.name ]
                        )
                        allSections
                    )
                ]
    in
    div
        [ Attr.class "-mr-2 flex md:hidden"
        ]
        [ button
            [ Attr.type_ "button"
            , Attr.class "relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            , Attr.attribute "aria-controls" "mobile-menu"
            , Attr.attribute "aria-expanded" "false"
            , onClick ToggleMenu
            ]
            [ span
                [ Attr.class "absolute -inset-0.5"
                ]
                []
            , srOnly (mobile model "Close menu" "Open menu")
            , mobile model closeIcon hamburgerMenuIcon
            , mobile model contents (text "")
            ]
        ]
        |> Html.map props.onShellMsg


mobile : Model -> a -> a -> a
mobile model ifOpen ifClosed =
    case model.mobileMenuState of
        Open ->
            ifOpen

        Closed ->
            ifClosed
