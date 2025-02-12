module Main exposing (Model, Msg, main)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState, MainViewProps)
import NotFound
import Page.Contact as PageContact
import Page.Donate as PageDonate
import Page.Index as PageIndex
import Page.Sponsors as PageSponsors
import Page.Y24.Index as PageY24Index
import Page.Y24.Photos as PageY24Photos
import Route exposing (Route)
import Templates.Shell as Shell
import Url


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
                |> getPageFromRoute global
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
                        |> getPageFromRoute readyModel.global
            in
            ( Ready { readyModel | page = page }
            , Cmd.map (ReadyMsg << ChangedPage) cmd
            )

        ( ReadyMsg readyMsg, Ready readyModel ) ->
            updateReady readyMsg readyModel |> Tuple.mapFirst (\m -> Ready m)


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
            Debug.log "Main.view iwth ready model"
                viewReady
                readyModel


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
    = PageContact
    | PageDonate
    | PageIndex
    | PageSponsors
    | PageY24Index
    | PageY24Photos PageY24Photos.Model
    | PageNotFound


type PageMsg
    = PageIndexMsg PageIndex.Msg
    | PageY24PhotosMsg PageY24Photos.Msg


getPageFromRoute : GlobalState -> Maybe Route -> ( Page, Cmd PageMsg )
getPageFromRoute global maybeRoute =
    case maybeRoute of
        Just Route.RouteY24Photos ->
            PageY24Photos.init
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map PageY24PhotosMsg)

        Just Route.RouteContact ->
            ( PageContact, Cmd.none )

        Just Route.RouteDonate ->
            ( PageDonate, Cmd.none )

        Just Route.RouteIndex ->
            ( PageIndex, Cmd.none )

        Just Route.RouteSponsors ->
            ( PageSponsors, Cmd.none )

        Just Route.RouteY24Index ->
            ( PageY24Index, Cmd.none )

        Nothing ->
            ( PageNotFound, Cmd.none )


viewReady : ReadyModel -> Browser.Document Msg
viewReady model =
    case model.page of
        PageContact ->
            PageContact.view (shellViewProps model)

        PageDonate ->
            PageDonate.view (shellViewProps model)

        PageIndex ->
            PageIndex.view (mainViewProps model.global PageIndexMsg) (shellViewProps model)

        PageSponsors ->
            PageSponsors.view (shellViewProps model)

        PageY24Index ->
            PageY24Index.view (shellViewProps model)

        PageY24Photos pageModel ->
            PageY24Photos.view (shellViewProps model) pageModel

        PageNotFound ->
            NotFound.view


updatePage : ReadyModel -> PageMsg -> ( Page, Cmd Msg )
updatePage model msg =
    case ( model.page, msg ) of
        ( PageIndex, PageIndexMsg pageMsg ) ->
            PageIndex.update model.global pageMsg
                |> (\c -> ( model.page, Cmd.map (ReadyMsg << ChangedPage << PageIndexMsg) c ))

        ( PageY24Photos pageModel, PageY24PhotosMsg pageMsg ) ->
            PageY24Photos.update pageMsg pageModel
                |> Tuple.mapFirst PageY24Photos
                |> Tuple.mapSecond (Cmd.map (ReadyMsg << ChangedPage << PageY24PhotosMsg))

        ( page, _ ) ->
            ( page, Cmd.none )
