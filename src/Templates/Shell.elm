module Templates.Shell exposing (ViewProps, MobileMenuState, Model, ShellMsg, init, render, update)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState)
import Constants exposing (logoSrc)
import Html exposing (Html, a, button, div, h1, header, img, main_, nav, span, text)
import Html.Attributes as Attr
import Html.Events exposing (onClick)
import Svg exposing (path, svg)
import Svg.Attributes as SvgAttr
import Ui.Elements exposing (textColor)
import Urls
import Url

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


enableNotifications : Bool
enableNotifications =
    False


enableProfileDropdown : Bool
enableProfileDropdown =
    False


type alias Section =
    { href : String, name : String }


allSections : List Section
allSections =
    [
        { href = Urls.index, name = "Overview" }
        , { href = Urls.photos, name = "Photos" }
        , { href = Urls.events2024, name = "2024 Event" }
        , { href = Urls.sponsors, name = "Sponsors" }
        , { href = Urls.donate, name = "Donate" }
        , { href = Urls.contact, name = "Contact" }
    ]


topNavSections : Url.Url -> Html msg
topNavSections currentUrl =
    div
        [ Attr.class "hidden md:block" ]
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
        [ Attr.class "shrink-0"
        
        ]
        [ img
            [ Attr.class "h-12 w-36"
            , Attr.src logoSrc
            , Attr.alt "2025 Bergen Tech Hackathon"
            , onClick (RedirectTo Urls.index)
            ]
            []
        ]
    |> Html.map props.onShellMsg

gated : Bool -> Html msg -> List (Html msg)
gated enabled content =
    if enabled then
        [ content ]

    else
        []


notificationsAndProfile : Html msg
notificationsAndProfile =
    let
        contents : List (Html msg)
        contents =
            List.concat
                [ gated enableNotifications notifications
                , gated enableProfileDropdown profileDropdown
                ]
    in
    if List.isEmpty contents then
        text ""

    else
        div [ Attr.class "ml-4 flex items-center md:ml-6" ] contents


notifications : Html msg
notifications =
    button
        [ Attr.type_ "button"
        , Attr.class "relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
        ]
        [ span
            [ Attr.class "absolute -inset-1.5"
            ]
            []
        , srOnly "View notifications"
        , svg
            [ SvgAttr.class "h-6 w-6"
            , SvgAttr.fill "none"
            , SvgAttr.viewBox "0 0 24 24"
            , SvgAttr.strokeWidth "1.5"
            , SvgAttr.stroke "currentColor"
            , Attr.attribute "aria-hidden" "true"
            , Attr.attribute "data-slot" "icon"
            ]
            [ path
                [ SvgAttr.strokeLinecap "round"
                , SvgAttr.strokeLinejoin "round"
                , SvgAttr.d "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                ]
                []
            ]
        ]


profileDropdown : Html msg
profileDropdown =
    div [ Attr.class "relative ml-3" ]
        [ div []
            [ button
                [ Attr.type_ "button"
                , Attr.class "relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                , Attr.id "user-menu-button"
                , Attr.attribute "aria-expanded" "false"
                , Attr.attribute "aria-haspopup" "true"
                ]
                [ span
                    [ Attr.class "absolute -inset-1.5"
                    ]
                    []
                , srOnly "Open user menu"
                , img
                    [ Attr.class "h-8 w-8 rounded-full"
                    , Attr.src "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    , Attr.alt ""
                    ]
                    []
                ]
            ]
        , {-
             Dropdown menu, show/hide based on menu state.

             Entering: "transition ease-out duration-100"
             From: "transform opacity-0 scale-95"
             To: "transform opacity-100 scale-100"
             Leaving: "transition ease-in duration-75"
             From: "transform opacity-100 scale-100"
             To: "transform opacity-0 scale-95"
          -}
          div
            [ Attr.class "absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            , Attr.attribute "role" "menu"
            , Attr.attribute "aria-orientation" "vertical"
            , Attr.attribute "aria-labelledby" "user-menu-button"
            , Attr.tabindex -1
            ]
            [ {- Active: "bg-gray-100 outline-none", Not Active: "" -}
              a
                [ Attr.href "#"
                , Attr.class "block px-4 py-2 text-sm text-gray-700"
                , Attr.attribute "role" "menuitem"
                , Attr.tabindex -1
                , Attr.id "user-menu-item-0"
                ]
                [ text "Your Profile" ]
            , a
                [ Attr.href "#"
                , Attr.class "block px-4 py-2 text-sm text-gray-700"
                , Attr.attribute "role" "menuitem"
                , Attr.tabindex -1
                , Attr.id "user-menu-item-1"
                ]
                [ text "Settings" ]
            , a
                [ Attr.href "#"
                , Attr.class "block px-4 py-2 text-sm text-gray-700"
                , Attr.attribute "role" "menuitem"
                , Attr.tabindex -1
                , Attr.id "user-menu-item-2"
                ]
                [ text "Sign out" ]
            ]
        ]


render : ViewProps msg -> String -> List (Html msg) -> Browser.Document msg
render props title contents =
    {
        title = title
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
                    , div
                        [ Attr.class "hidden md:block"
                        ]
                        [ notificationsAndProfile
                        ]
                    , mobileMenuButton props.shellModel props
                    ]
                ]
            , {- Mobile menu, show/hide based on menu state. -}
              div
                [ Attr.class "md:hidden"
                , Attr.id "mobile-menu"
                ]
                [ mobileNotificationsAndMenu model global.url ]
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


mobileNotificationsAndMenu : Model -> Url.Url -> Html msg
mobileNotificationsAndMenu model currentUrl =
    let
        showMobileMenu : Bool
        showMobileMenu =
            case model.mobileMenuState of
                Open ->
                    True

                Closed ->
                    False

        contents : List (Html msg)
        contents =
            List.concat
                [ gated enableNotifications mobileNotifications
                , gated showMobileMenu (mobileMenu currentUrl)
                ]
    in
    if List.isEmpty contents then
        text ""

    else
        div [ Attr.class "border-t border-gray-700 pb-3 pt-4" ] contents


mobileNotifications : Html msg
mobileNotifications =
    div
        [ Attr.class "flex items-center px-5"
        ]
        [ div
            [ Attr.class "shrink-0"
            ]
            [ img
                [ Attr.class "h-10 w-10 rounded-full"
                , Attr.src "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                , Attr.alt ""
                ]
                []
            ]
        , div
            [ Attr.class "ml-3"
            ]
            [ div
                [ Attr.class "text-base font-medium text-white"
                ]
                [ text "Tom Cook" ]
            , div
                [ Attr.class "text-sm font-medium text-gray-400"
                ]
                [ text "tom@example.com" ]
            ]
        , button
            [ Attr.type_ "button"
            , Attr.class "relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            ]
            [ span
                [ Attr.class "absolute -inset-1.5"
                ]
                []
            , srOnly "View notifications"
            , svg
                [ SvgAttr.class "h-6 w-6"
                , SvgAttr.fill "none"
                , SvgAttr.viewBox "0 0 24 24"
                , SvgAttr.strokeWidth "1.5"
                , SvgAttr.stroke "currentColor"
                , Attr.attribute "aria-hidden" "true"
                , Attr.attribute "data-slot" "icon"
                ]
                [ path
                    [ SvgAttr.strokeLinecap "round"
                    , SvgAttr.strokeLinejoin "round"
                    , SvgAttr.d "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    ]
                    []
                ]
            ]
        ]


mobileMenuLink : Url.Url -> Section -> Html msg
mobileMenuLink currentUrl section =
    let
        isActive : Bool
        isActive =
            isSectionActive currentUrl section
        
        css : String
        css =
            if isActive then
                "bg-gray-900 text-white"

            else
                "text-gray-400 hover:bg-gray-700 hover:text-white"
    in
    a
        [ Attr.href section.href
        , Attr.class ("block rounded-md px-3 py-2 text-base font-medium " ++ css)
        ]
        [ text section.name ]

mobileMenu : Url.Url -> Html msg
mobileMenu currentUrl =
    div
        [ Attr.class "mt-3 space-y-1 px-2"
        ]
        (List.map (mobileMenuLink currentUrl) allSections)


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
            , srOnly
                (case model.mobileMenuState of
                    Open ->
                        "Close menu"

                    Closed ->
                        "Open menu"
                )
            , case model.mobileMenuState of
                Open ->
                    closeIcon

                Closed ->
                    hamburgerMenuIcon
            ]
        ]
        |> Html.map props.onShellMsg
