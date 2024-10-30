module Main exposing (..)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav
import Constants exposing (httpRequestParamsById)
import Html exposing (Html)
import Page.Index as PageIndex
import Route
import Url
import Urls
import Templates.CenteredPage exposing (renderCenteredPage, link, renderLoading)
import Global exposing (GlobalState)

type alias Flags =
    { sessionId : Maybe String }

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
    { state : IntermediateState
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
            { state = state
              , page = Nothing
              , url = url
            }
    in
    renderPage initModel


renderPage : Model -> (Model, Cmd MainMsg)
renderPage model =          
    case parseUrl model.state model.url of
        Just (p, c) ->
            ( { model | page = Just p }, c)

        Nothing ->
            ( { model | page = Nothing }, Cmd.none )

type MainInternalMsg
    = LinkClicked UrlRequest
    | UrlChanged Url.Url
    | SessionResponse (ApiResult Session)
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
            case parseUrl model.state model.session url of
                Nothing ->
                    (model, Cmd.none)

                Just (p, cmd) ->
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
        SessionResponse (Ok session) ->
            let
                newModel : Model
                newModel = { model | sessionRequest = ApiRequest.Success session, session = Just session }
            in
            renderPage newModel (Just session)

        SessionResponse (Err e) ->
            let
                newModel : Model
                newModel = { model | sessionRequest = ApiRequest.Failure e, session = Nothing }
            in
            renderPage newModel Nothing


view : Model -> Document MainMsg
view model =
    { title = "Acumen"
    , body =
        [ case model.page of
            Nothing ->
                case model.sessionRequest of
                    ApiRequest.Loading ->
                        renderLoading

                    _ ->
                        viewNotFound

            Just p ->
                pageView p
        ]
    }

viewNotFound : Html MainMsg
viewNotFound =
    renderErrorPage {
        title = "Page not found"
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
    renderCenteredPage { title = params.title } (List.append
        [Html.p [] [ Html.text params.body ]]
        htmlLink
    )

type alias Session =
    { id : String }



parseUrl : IntermediateState -> Url.Url -> Maybe (Page, Cmd MainMsg)
parseUrl state url =
    Maybe.map (toPage state Nothing) (Route.parseUrl url)

-- CODEGEN START
type Page
    = PageIndex PageIndex.Model


type MainPageMsg
    = PageIndexMsg PageIndex.Msg


toPage : IntermediateState -> Maybe Session -> Route.Route -> (Page, Cmd MainMsg)
toPage state session route =
    case route of
        Route.PageIndex ->
            loggedInWithGroupPage state session (\auth ->
                let
                    (model, msg) = PageIndex.init auth
                in
                (PageIndex model, Cmd.map PageMsg (Cmd.map PageIndexMsg msg))
            )


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
            (model, Cmd.none)

        Just p ->
            case ( msg, p ) of
                (PageIndexMsg pageMsg, PageIndex pageModel) ->
                    let
                        (newModel, newCmd) = PageIndex.update pageMsg pageModel
                    in
                    ({ model | page = Just (PageIndex newModel) }, Cmd.map PageMsg (Cmd.map PageIndexMsg newCmd))

                (PageIndexMsg _, _) ->
                    (model, Cmd.none)