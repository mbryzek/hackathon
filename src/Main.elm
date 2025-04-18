module Main exposing (Model, Msg, main)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState, MainViewProps)
import NotFound
import Route exposing (Route)
import Templates.Shell as Shell
import Url
import Page.Claire as PageClaire
import Page.Contact as PageContact
import Page.Donate as PageDonate
import Page.Index as PageIndex
import Page.Luna as PageLuna
import Page.Y24.Index as PageY24Index
import Page.Y24.Photos as PageY24Photos
import Page.Y24.Sponsors as PageY24Sponsors
import Page.Y25.Demos as PageY25Demos
import Page.Y25.Index as PageY25Index
import Page.Y25.Photos as PageY25Photos
import Page.Y25.Prizes as PageY25Prizes
import Page.Y25.Rubric as PageY25Rubric
import Page.Y25.Sponsors as PageY25Sponsors


main : Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = LinkClicked
        }


type Model
    = Ready ReadyModel


type alias ReadyModel =
    { global : GlobalState
    , shellModel : Shell.Model
    , page : Page
    }


init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    initWithGlobal { navKey = key, url = url }


initWithGlobal : GlobalState -> ( Model, Cmd Msg )
initWithGlobal global =
    let
        ( shellModel, shellCmd ) =
            Shell.init

        ( page, cmd ) =
            Route.fromUrl global.url
                |> getPageFromRoute
    in
    ( Ready
        { global = global
        , shellModel = shellModel
        , page = page
        }
    , Cmd.batch
        [ Cmd.map (ReadyMsg << ChangedPage) cmd
        , Cmd.map (ReadyMsg << ChangedInternal << ShellMsg) shellCmd
        ]
    )


type Msg
    = ReadyMsg ReadyMsg
    | LinkClicked Browser.UrlRequest
    | UrlChanged Url.Url


type ReadyMsg
    = ChangedInternal InternalMsg
    | ChangedPage PageMsg


type InternalMsg
    = ShellMsg Shell.ShellMsg


redirectTo : Model -> String -> Cmd Msg
redirectTo model url =
    let
        key : Nav.Key
        key =
            case model of
                Ready rm ->
                    Global.getNavKey rm.global
    in
    Nav.pushUrl key url


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case ( msg, model ) of
        ( LinkClicked urlRequest, _ ) ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, redirectTo model (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        ( UrlChanged url, Ready readyModel ) ->
            let
                ( page, cmd ) =
                    Route.fromUrl url
                        |> getPageFromRoute
            in
            ( Ready { readyModel | page = page, global = updateGlobalState readyModel.global url }
            , Cmd.map (ReadyMsg << ChangedPage) cmd
            )

        ( ReadyMsg readyMsg, Ready readyModel ) ->
            updateReady readyMsg readyModel |> Tuple.mapFirst (\m -> Ready m)


updateGlobalState : GlobalState -> Url.Url -> GlobalState
updateGlobalState global url =
    { global | url = url }


updateReady : ReadyMsg -> ReadyModel -> ( ReadyModel, Cmd Msg )
updateReady msg model =
    case msg of
        ChangedInternal internalMsg ->
            updateInternal internalMsg model

        ChangedPage pageMsg ->
            updatePage model pageMsg
                |> Tuple.mapFirst (\page -> { model | page = page })


updateInternal : InternalMsg -> ReadyModel -> ( ReadyModel, Cmd Msg )
updateInternal msg model =
    case msg of
        ShellMsg shellMsg ->
            Shell.update model.global shellMsg model.shellModel
                |> Tuple.mapFirst (\m -> { model | shellModel = m })
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedInternal << ShellMsg))


view : Model -> Browser.Document Msg
view model =
    case model of
        Ready readyModel ->
            viewReady readyModel


shellViewProps : ReadyModel -> Shell.ViewProps Msg
shellViewProps model =
    { global = model.global
    , shellModel = model.shellModel
    , onShellMsg = ReadyMsg << ChangedInternal << ShellMsg
    }


mainViewProps : GlobalState -> (a -> PageMsg) -> MainViewProps a Msg
mainViewProps global a =
    { global = global
    , msgMap = ReadyMsg << ChangedPage << a
    }


subscriptions : Model -> Sub Msg
subscriptions _ =
    pageSubscriptions |> Sub.map (ReadyMsg << ChangedPage)



-- Organized so the below can be code generated
-- CODEGEN START
pageSubscriptions : Sub PageMsg
pageSubscriptions =
    Sub.none


type Page
    = PageClaire
    | PageContact
    | PageDonate
    | PageIndex
    | PageLuna
    | PageY24Index
    | PageY24Photos PageY24Photos.Model
    | PageY24Sponsors
    | PageY25Demos PageY25Demos.Model
    | PageY25Index
    | PageY25Photos PageY25Photos.Model
    | PageY25Prizes
    | PageY25Rubric
    | PageY25Sponsors
    | PageNotFound


type PageMsg
    = PageIndexMsg PageIndex.Msg
    | PageY24PhotosMsg PageY24Photos.Msg
    | PageY25DemosMsg PageY25Demos.Msg
    | PageY25IndexMsg PageY25Index.Msg
    | PageY25PhotosMsg PageY25Photos.Msg


getPageFromRoute : Maybe Route -> ( Page, Cmd PageMsg )
getPageFromRoute maybeRoute =
    case maybeRoute of
        Just Route.RouteY24Photos ->
            PageY24Photos.init
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map PageY24PhotosMsg)

        Just Route.RouteY25Demos ->
            PageY25Demos.init
                |> Tuple.mapFirst PageY25Demos
                |> Tuple.mapSecond (Cmd.map PageY25DemosMsg)

        Just Route.RouteY25Photos ->
            PageY25Photos.init
                |> Tuple.mapFirst PageY25Photos
                |> Tuple.mapSecond (Cmd.map PageY25PhotosMsg)
        Just Route.RouteClaire ->
            ( PageClaire, Cmd.none )
        Just Route.RouteContact ->
            ( PageContact, Cmd.none )
        Just Route.RouteDonate ->
            ( PageDonate, Cmd.none )
        Just Route.RouteIndex ->
            ( PageIndex, Cmd.none )
        Just Route.RouteLuna ->
            ( PageLuna, Cmd.none )
        Just Route.RouteY24Index ->
            ( PageY24Index, Cmd.none )
        Just Route.RouteY24Sponsors ->
            ( PageY24Sponsors, Cmd.none )
        Just Route.RouteY25Index ->
            ( PageY25Index, Cmd.none )
        Just Route.RouteY25Prizes ->
            ( PageY25Prizes, Cmd.none )
        Just Route.RouteY25Rubric ->
            ( PageY25Rubric, Cmd.none )
        Just Route.RouteY25Sponsors ->
            ( PageY25Sponsors, Cmd.none )

        Nothing ->
            ( PageNotFound, Cmd.none )


viewReady : ReadyModel -> Browser.Document Msg
viewReady model =
    case model.page of
        PageClaire ->
            PageClaire.view (shellViewProps model)

        PageContact ->
            PageContact.view (shellViewProps model)

        PageDonate ->
            PageDonate.view (shellViewProps model)

        PageIndex ->
            PageIndex.view (mainViewProps model.global PageIndexMsg) (shellViewProps model)

        PageLuna ->
            PageLuna.view (shellViewProps model)

        PageY24Index ->
            PageY24Index.view (shellViewProps model)

        PageY24Photos pageModel ->
            PageY24Photos.view (shellViewProps model) pageModel

        PageY24Sponsors ->
            PageY24Sponsors.view (shellViewProps model)

        PageY25Demos pageModel ->
            PageY25Demos.view (shellViewProps model) pageModel

        PageY25Index ->
            PageY25Index.view (mainViewProps model.global PageY25IndexMsg) (shellViewProps model)

        PageY25Photos pageModel ->
            PageY25Photos.view (shellViewProps model) pageModel

        PageY25Prizes ->
            PageY25Prizes.view (shellViewProps model)

        PageY25Rubric ->
            PageY25Rubric.view (shellViewProps model)

        PageY25Sponsors ->
            PageY25Sponsors.view (shellViewProps model)

        PageNotFound ->
            NotFound.view


updatePage : ReadyModel -> PageMsg -> ( Page, Cmd Msg )
updatePage model msg =
    case ( model.page, msg ) of
        ( PageIndex, PageIndexMsg pageMsg ) ->
            PageIndex.update model.global pageMsg
                |> \c -> (model.page, Cmd.map (ReadyMsg << ChangedPage << PageIndexMsg) c)

        ( PageY24Photos pageModel, PageY24PhotosMsg pageMsg ) ->
            PageY24Photos.update pageMsg pageModel
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY24PhotosMsg))

        ( PageY25Demos pageModel, PageY25DemosMsg pageMsg ) ->
            PageY25Demos.update pageMsg pageModel
                |> Tuple.mapFirst PageY25Demos
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY25DemosMsg))

        ( PageY25Index, PageY25IndexMsg pageMsg ) ->
            PageY25Index.update model.global pageMsg
                |> \c -> (model.page, Cmd.map (ReadyMsg << ChangedPage << PageY25IndexMsg) c)

        ( PageY25Photos pageModel, PageY25PhotosMsg pageMsg ) ->
            PageY25Photos.update pageMsg pageModel
                |> Tuple.mapFirst PageY25Photos
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY25PhotosMsg))

        ( page, _ ) ->
            ( page, Cmd.none )