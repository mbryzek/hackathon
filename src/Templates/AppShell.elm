module Templates.AppShell exposing (..)

import Constants exposing (logoSvg)
import Html exposing (..)
import Html.Attributes as Attr
import Generated.ComBryzekAcumenApi exposing (User)
import Generated.ApiRequest as ApiRequest exposing (ApiRequest, ApiError)
import Templates.Messages exposing (viewNonFieldErrors)
import Urls

type alias Params =
    { title : String, user: User }


renderAppShellRequest : ApiRequest a -> Params -> (a -> List (Html msg)) -> Html msg
renderAppShellRequest request params onSuccess =
    case request of
        ApiRequest.Success i ->
            renderAppShell params (onSuccess i)

        ApiRequest.Failure e ->
            renderErrorPage params.user e

        _ ->
            renderLoading params.user


renderAppShell : Params -> List (Html msg) -> Html msg
renderAppShell params content =
    div [ Attr.class "flex h-screen bg-gray-100" ]
        [ renderSidebar
        , div [ Attr.class "flex flex-col flex-1" ]
            [ renderHeader params.user params.title
            , main_ [ Attr.class "flex-1 overflow-y-auto p-6" ] content
            , renderFooter
            ]
        ]

renderSidebar : Html msg
renderSidebar =
    nav [ Attr.class "w-64 bg-indigo-700 text-white p-6" ]
        [ div [ Attr.class "mb-8" ]
            [ logoSvg ]
        , ul [ Attr.class "space-y-2" ]
            [ navItem "Transactions" Urls.index
            , navItem "Review" Urls.review
            , navItem "Accounts" Urls.accounts
            ]
        ]

navItem : String -> String -> Html msg
navItem label href =
    li []
        [ a [ Attr.href href, Attr.class "block py-2 px-4 rounded hover:bg-indigo-600" ]
            [ text label ]
        ]

renderHeader : User -> String -> Html msg
renderHeader user title =
    header [ Attr.class "bg-white shadow" ]
        [ div [ Attr.class "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center" ]
            [ h1 [ Attr.class "text-3xl font-bold text-gray-900" ]
                [ text title ]
            , renderProfileTab user
            ]
        ]

renderProfileTab : User -> Html msg
renderProfileTab user =
    div [ Attr.class "flex items-center" ]
        [ img
            [ Attr.src "https://via.placeholder.com/40"
            , Attr.alt "Profile"
            , Attr.class "w-10 h-10 rounded-full mr-3"
            ]
            []
        , div [ Attr.class "text-sm" ]
            [ p [ Attr.class "text-gray-900 font-medium" ] [ text (Maybe.withDefault user.email user.name) ]
            ]
        ]

renderFooter : Html msg
renderFooter =
    footer [ Attr.class "bg-gray-800 text-white py-4" ]
        [ div [ Attr.class "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" ]
            [ p [ Attr.class "text-sm" ]
                [ text "© 2024 Bryzek LLC. All rights reserved. "
                , a [ Attr.href "/terms", Attr.class "hover:underline" ] [ text "Terms" ]
                , text " | "
                , a [ Attr.href "/privacy", Attr.class "hover:underline" ] [ text "Privacy" ]
                ]
            ]
        ]

renderLoading : User -> Html msg
renderLoading user =
    renderAppShell
        { title = "Loading", user = user } [
            div [ Attr.class "flex justify-center items-center h-full" ]
                [ p [ Attr.class "italic text-xl" ] [ text "Loading..." ]
                ]
        ]


renderErrorPage : User -> ApiError -> Html msg
renderErrorPage user e =
    renderAppShell { title = "Error", user = user } [
        viewNonFieldErrors (ApiRequest.Failure e)
    ]
