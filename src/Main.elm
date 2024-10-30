module Main exposing (..)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav
import Global exposing (GlobalState, SessionState(..))
import Html exposing (Html)
import Page.Index as PageIndex
import Route
import Templates.CenteredPage exposing (link, renderCenteredPage)
import Url
import Urls


type alias Flags =
    {}


main : Program Flags Model MainMsg
main =
    Browser.application
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        , onUrlRequest = \v -> InternalMsg (LinkClicked v)
        , onUrlChange = \v -> InternalMsg (UrlChanged v)
        }


subscriptions : Model -> Sub MainMsg
subscriptions _ =
    Sub.none


type alias Model =
    { session : GlobalState
    , state : IntermediateState
    , url : Url.Url
    , page : Maybe Page
    }


type alias IntermediateState =
    { navKey : Nav.Key }


init : Flags -> Url.Url -> Nav.Key -> ( Model, Cmd MainMsg )
init _ url navKey =
    let
        state : IntermediateState
        state =
            { navKey = navKey }

        initModel : Model
        initModel =
            { session = { session = SessionLoggedOut, navKey = navKey }
            , state = state
            , page = Nothing
            , url = url
            }
    in
    renderPage initModel


renderPage : Model -> ( Model, Cmd MainMsg )
renderPage model =
    case parseUrl model.state model.url of
        Just ( p, c ) ->
            ( { model | page = Just p }, c )

        Nothing ->
            ( { model | page = Nothing }, Cmd.none )


type MainInternalMsg
    = LinkClicked UrlRequest
    | UrlChanged Url.Url
    | RedirectTo String


type MainMsg
    = InternalMsg MainInternalMsg
    | PageMsg MainPageMsg


update : MainMsg -> Model -> ( Model, Cmd MainMsg )
update msg model =
    case msg of
        InternalMsg m ->
            handleInternalMsg m model

        PageMsg m ->
            handlePageMsg m model


handleInternalMsg : MainInternalMsg -> Model -> ( Model, Cmd MainMsg )
handleInternalMsg msg model =
    case msg of
        UrlChanged url ->
            case parseUrl model.state url of
                Nothing ->
                    ( model, Cmd.none )

                Just ( p, cmd ) ->
                    ( { model | page = Just p }, cmd )

        RedirectTo u ->
            ( model, Nav.pushUrl model.state.navKey u )

        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model
                    , Nav.pushUrl model.state.navKey (Url.toString url)
                    )

                Browser.External url ->
                    ( model
                    , Nav.load url
                    )


view : Model -> Document MainMsg
view model =
    { title = "Acumen"
    , body =
        [ case model.page of
            Nothing ->
                viewNotFound

            Just p ->
                pageView p
        ]
    }


viewNotFound : Html MainMsg
viewNotFound =
    renderErrorPage
        { title = "Page not found"
        , body = "The page you are looking for does not exist."
        , link = Just (link (RedirectTo Urls.index) "Go to the home page")
        }


type alias ErrorPageParams =
    { title : String
    , body : String
    , link : Maybe (Html MainInternalMsg)
    }


renderErrorPage : ErrorPageParams -> Html MainMsg
renderErrorPage params =
    let
        htmlLink : List (Html MainMsg)
        htmlLink =
            case params.link of
                Nothing ->
                    []

                Just l ->
                    [ Html.map InternalMsg l ]
    in
    renderCenteredPage { title = params.title }
        (List.append
            [ Html.p [] [ Html.text params.body ] ]
            htmlLink
        )


type alias Session =
    { id : String }


parseUrl : IntermediateState -> Url.Url -> Maybe ( Page, Cmd MainMsg )
parseUrl state url =
    Maybe.map (toPage state Nothing) (Route.parseUrl url)


toGlobalState : IntermediateState -> Maybe Session -> GlobalState
toGlobalState state _ =
    { session = SessionLoggedOut
    , navKey = state.navKey
    }



-- CODEGEN START


type Page
    = PageIndex PageIndex.Model


type MainPageMsg
    = PageIndexMsg PageIndex.Msg


toPage : IntermediateState -> Maybe Session -> Route.Route -> ( Page, Cmd MainMsg )
toPage state session route =
    case route of
        Route.PageIndex ->
            ( PageIndex (PageIndex.init (toGlobalState state session)), Cmd.none )


pageView : Page -> Html MainMsg
pageView page =
    case page of
        PageIndex pageModel ->
            PageIndex.view pageModel
                |> Html.map PageIndexMsg
                |> Html.map PageMsg


handlePageMsg : MainPageMsg -> Model -> ( Model, Cmd MainMsg )
handlePageMsg msg model =
    case model.page of
        Nothing ->
            ( model, Cmd.none )

        Just p ->
            let
                ( PageIndexMsg pageMsg, PageIndex pageModel ) =
                    ( msg, p )

                ( newModel, newCmd ) =
                    PageIndex.update pageMsg pageModel
            in
            ( { model | page = Just (PageIndex newModel) }, Cmd.map PageMsg (Cmd.map PageIndexMsg newCmd) )
