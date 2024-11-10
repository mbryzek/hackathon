module Templates.Shell exposing (ShellProps, renderShell)

import Html exposing (Html, div, nav, main_, header, h1, a, button, span, img, text)
import Html.Attributes as Attr
import Svg exposing (svg, path)
import Svg.Attributes as SvgAttr
import Constants exposing (logoSrc)

type alias ShellProps = 
    { title : String }

navLink : String -> String -> Bool -> Html msg
navLink href label isActive =
    a
        [ Attr.href href
        , Attr.class <| 
            "rounded-md px-3 py-2 text-sm font-medium " ++
            if isActive then
                "bg-gray-900 text-white"
            else
                "text-gray-300 hover:bg-gray-700 hover:text-white"
        , if isActive then Attr.attribute "aria-current" "page" else Attr.class ""
        ]
        [ text label ]

logo : Html msg
logo =
    div
        [ Attr.class "shrink-0"
        ]
        [ img
            [ Attr.class "h-12 w-36"
            , Attr.src logoSrc
            , Attr.alt "Bergen Tech Hackathon"
            , Attr.href "/"
            ]
            []
        ]

topNavSections : Html msg
topNavSections =
    div
        [ Attr.class "hidden md:block"] [
            div
                [ Attr.class "ml-10 flex items-baseline space-x-4"
                ]
                [ navLink "#" "Dashboard" True
                , navLink "#" "Team" False
                , navLink "#" "Projects" False
                , navLink "#" "Calendar" False
                , navLink "#" "Reports" False
                ]
        ]

renderShell : ShellProps -> List (Html msg) -> Html msg
renderShell props contents =
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
                        [ logo
                        , topNavSections
                        ]
                    , div
                        [ Attr.class "hidden md:block"
                        ]
                        [ div
                            [ Attr.class "ml-4 flex items-center md:ml-6"
                            ]
                            [ button
                                [ Attr.type_ "button"
                                , Attr.class "relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                ]
                                [ span
                                    [ Attr.class "absolute -inset-1.5"
                                    ]
                                    []
                                , span
                                    [ Attr.class "sr-only"
                                    ]
                                    [ text "View notifications" ]
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
                            ,                             {- Profile dropdown -}
                            div
                                [ Attr.class "relative ml-3"
                                ]
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
                                        , span
                                            [ Attr.class "sr-only"
                                            ]
                                            [ text "Open user menu" ]
                                        , img
                                            [ Attr.class "h-8 w-8 rounded-full"
                                            , Attr.src "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            , Attr.alt ""
                                            ]
                                            []
                                        ]
                                    ]
                                ,                                 {-
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
                                    [                                     {- Active: "bg-gray-100 outline-none", Not Active: "" -}
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
                            ]
                        ]
                    , div
                        [ Attr.class "-mr-2 flex md:hidden"
                        ]
                        [                         {- Mobile menu button -}
                        button
                            [ Attr.type_ "button"
                            , Attr.class "relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                            , Attr.attribute "aria-controls" "mobile-menu"
                            , Attr.attribute "aria-expanded" "false"
                            ]
                            [ span
                                [ Attr.class "absolute -inset-0.5"
                                ]
                                []
                            , span
                                [ Attr.class "sr-only"
                                ]
                                [ text "Open main menu" ]
                            ,                             {- Menu open: "hidden", Menu closed: "block" -}
                            svg
                                [ SvgAttr.class "block h-6 w-6"
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
                                    , SvgAttr.d "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                    ]
                                    []
                                ]
                            ,                             {- Menu open: "block", Menu closed: "hidden" -}
                            svg
                                [ SvgAttr.class "hidden h-6 w-6"
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
                                    , SvgAttr.d "M6 18 18 6M6 6l12 12"
                                    ]
                                    []
                                ]
                            ]
                        ]
                    ]
                ]
            ,             {- Mobile menu, show/hide based on menu state. -}
            div
                [ Attr.class "md:hidden"
                , Attr.id "mobile-menu"
                ]
                [ div
                    [ Attr.class "space-y-1 px-2 pb-3 pt-2 sm:px-3"
                    ]
                    [                     {- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -}
                    a
                        [ Attr.href "#"
                        , Attr.class "block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
                        , Attr.attribute "aria-current" "page"
                        ]
                        [ text "Dashboard" ]
                    , a
                        [ Attr.href "#"
                        , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        ]
                        [ text "Team" ]
                    , a
                        [ Attr.href "#"
                        , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        ]
                        [ text "Projects" ]
                    , a
                        [ Attr.href "#"
                        , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        ]
                        [ text "Calendar" ]
                    , a
                        [ Attr.href "#"
                        , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        ]
                        [ text "Reports" ]
                    ]
                , div
                    [ Attr.class "border-t border-gray-700 pb-3 pt-4"
                    ]
                    [ div
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
                            , span
                                [ Attr.class "sr-only"
                                ]
                                [ text "View notifications" ]
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
                    , div
                        [ Attr.class "mt-3 space-y-1 px-2"
                        ]
                        [ a
                            [ Attr.href "#"
                            , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                            ]
                            [ text "Your Profile" ]
                        , a
                            [ Attr.href "#"
                            , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                            ]
                            [ text "Settings" ]
                        , a
                            [ Attr.href "#"
                            , Attr.class "block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                            ]
                            [ text "Sign out" ]
                        ]
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
                    [ Attr.class "text-lg/6 font-semibold text-gray-900"
                    ]
                    [ text props.title ]
                ]
            ]
        , main_ []
            [ div
                [ Attr.class "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                ] contents
            ]
        ]
    