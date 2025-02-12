module Main exposing (..)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav
import Global exposing (GlobalState, SessionState(..))
import Html exposing (Html)
import Page.Contact as PageContact
import Page.Donate as PageDonate
import Page.Index as PageIndex
import Page.Sponsors as PageSponsors
import Page.Y24.Index as PageY24Index
import Page.Y24.Photos as PageY24Photos
import Route
import Templates.Shell as ShellTemplate exposing (renderShell)
import Ui.Elements exposing (link)
import Url
import Urls
import Page.Contact as PageContact
import Page.Donate as PageDonate
import Page.Index as PageIndex
import Page.Sponsors as PageSponsors
import Page.Y24.Index as PageY24Index
import Page.Y24.Photos as PageY24Photos


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


type alias Model =
    { session : GlobalState
    , state : IntermediateState
    , shell : ShellTemplate.Model
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

        ( shell, shellCmd ) =
            ShellTemplate.init navKey

        initModel : Model
        initModel =
            { session = { session = SessionLoggedOut, navKey = navKey }
            , state = state
            , shell = shell
            , page = Nothing
            , url = url
            }

        ( pageModel, pageCmd ) =
            renderPage initModel
    in
    ( pageModel, Cmd.batch [ Cmd.map (\m -> InternalMsg (ShellTemplateMsg m)) shellCmd, pageCmd ] )


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
    | ShellTemplateMsg ShellTemplate.ShellMsg


type MainMsg
    = InternalMsg MainInternalMsg
    | PageMsg MainPageMsg

type MainPageMsg = 
    Noop

update : MainMsg -> Model -> ( Model, Cmd MainMsg )
update msg model =
    case msg of
        InternalMsg m ->
            handleInternalMsg m model

        PageMsg m ->
            handlePageMsg m model

handlePageMsg : MainInternalMsg -> Model -> ( Model, Cmd MainMsg )
handlePageMsg msg model =
    case msg of 
        Noop ->
            ( model, Cmd.none )

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

        ShellTemplateMsg subMsg ->
            let
                ( updatedShell, shellCmd ) =
                    ShellTemplate.update subMsg model.shell
            in
            ( { model | shell = updatedShell }
            , Cmd.map (\m -> InternalMsg (ShellTemplateMsg m)) shellCmd
            )

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
    { title = "BT Hackathon"
    , body =
        [ case model.page of
            Nothing ->
                viewNotFound model

            Just p ->
                pageView p
        ]
    }


viewNotFound : Model -> Html MainMsg
viewNotFound model =
    renderErrorPage model
        { title = "Page not found"
        , body = "The page you are looking for does not exist."
        , link = Just (link (RedirectTo Urls.index) "Go to the home page")
        }


type alias ErrorPageParams =
    { title : String
    , body : String
    , link : Maybe (Html MainInternalMsg)
    }


renderErrorPage : Model -> ErrorPageParams -> Html MainMsg
renderErrorPage model params =
    let
        htmlLink : List (Html MainMsg)
        htmlLink =
            case params.link of
                Nothing ->
                    []

                Just l ->
                    [ Html.map InternalMsg l ]
    in
    renderShell model.shell
        (\m -> InternalMsg (ShellTemplateMsg m))
        { title = params.title
        , url = Nothing
        }
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

subscriptions : Sub PageMsg
subscriptions =
    pageSubscriptions


-- CODEGEN START
pageSubscriptions : Sub PageMsg
pageSubscriptions =
    Sub.none


type Page
    = PageContact PageContact.Model
    | PageDonate PageDonate.Model
    | PageIndex PageIndex.Model
    | PageSponsors PageSponsors.Model
    | PageY24Index PageY24Index.Model
    | PageY24Photos PageY24Photos.Model
    | PageNotFound
    | PageNotAuthorized


type PageMsg
    = PageContactMsg PageContact.Msg
    | PageDonateMsg PageDonate.Msg
    | PageIndexMsg PageIndex.Msg
    | PageSponsorsMsg PageSponsors.Msg
    | PageY24IndexMsg PageY24Index.Msg
    | PageY24PhotosMsg PageY24Photos.Msg


getPageFromRoute : GlobalState -> Maybe Route -> ( Page, Cmd PageMsg )
getPageFromRoute global maybeRoute =
    case maybeRoute of
        Just Route.RouteContact ->
            PageContact.init global
                |> Tuple.mapFirst PageContact
                |> Tuple.mapSecond (Cmd.map PageContactMsg)

        Just Route.RouteDonate ->
            PageDonate.init global
                |> Tuple.mapFirst PageDonate
                |> Tuple.mapSecond (Cmd.map PageDonateMsg)

        Just Route.RouteIndex ->
            PageIndex.init global
                |> Tuple.mapFirst PageIndex
                |> Tuple.mapSecond (Cmd.map PageIndexMsg)

        Just Route.RouteSponsors ->
            PageSponsors.init global
                |> Tuple.mapFirst PageSponsors
                |> Tuple.mapSecond (Cmd.map PageSponsorsMsg)

        Just Route.RouteY24Index ->
            PageY24Index.init global
                |> Tuple.mapFirst PageY24Index
                |> Tuple.mapSecond (Cmd.map PageY24IndexMsg)

        Just Route.RouteY24Photos ->
            PageY24Photos.init global
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map PageY24PhotosMsg)

        Nothing ->
            ( PageNotFound, Cmd.none )


viewReady : ReadyModel -> Browser.Document Msg
viewReady model =
    case model.page of
        PageContact pageModel ->
            PageContact.view pageModel |> mapDoc PageContactMsg

        PageDonate pageModel ->
            PageDonate.view pageModel |> mapDoc PageDonateMsg

        PageIndex pageModel ->
            PageIndex.view pageModel |> mapDoc PageIndexMsg

        PageSponsors pageModel ->
            PageSponsors.view pageModel |> mapDoc PageSponsorsMsg

        PageY24Index pageModel ->
            PageY24Index.view pageModel |> mapDoc PageY24IndexMsg

        PageY24Photos pageModel ->
            PageY24Photos.view pageModel |> mapDoc PageY24PhotosMsg

        PageNotFound ->
            NotFound.view

        PageNotAuthorized ->
            NotAuthorized.view


updatePage : ReadyModel -> PageMsg -> ( Page, Cmd Msg )
updatePage model msg =
    case ( model.page, msg ) of
        ( PageContact pageModel, PageContactMsg pageMsg ) ->
            PageContact.update pageMsg pageModel
                |> Tuple.mapFirst PageContact
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageContactMsg))

        ( PageDonate pageModel, PageDonateMsg pageMsg ) ->
            PageDonate.update pageMsg pageModel
                |> Tuple.mapFirst PageDonate
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageDonateMsg))

        ( PageIndex pageModel, PageIndexMsg pageMsg ) ->
            PageIndex.update pageMsg pageModel
                |> Tuple.mapFirst PageIndex
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageIndexMsg))

        ( PageSponsors pageModel, PageSponsorsMsg pageMsg ) ->
            PageSponsors.update pageMsg pageModel
                |> Tuple.mapFirst PageSponsors
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageSponsorsMsg))

        ( PageY24Index pageModel, PageY24IndexMsg pageMsg ) ->
            PageY24Index.update pageMsg pageModel
                |> Tuple.mapFirst PageY24Index
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY24IndexMsg))

        ( PageY24Photos pageModel, PageY24PhotosMsg pageMsg ) ->
            PageY24Photos.update pageMsg pageModel
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY24PhotosMsg))

        ( page, _ ) ->
            ( page, Cmd.none )