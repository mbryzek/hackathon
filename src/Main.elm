module Main exposing (Flags, Model, Msg, main)

import Browser
import Browser.Navigation as Nav
import Global exposing (GlobalState)
import Html as H
import Loading
import NotAuthorized
import NotFound
import Route exposing (Route)
import Templates.Shell as Shell
import Url
import Page.Contact as PageContact
import Page.Donate as PageDonate
import Page.Index as PageIndex
import Page.Sponsors as PageSponsors
import Page.Y24.Index as PageY24Index
import Page.Y24.Photos as PageY24Photos


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
    = Init InitModel
    | Ready ReadyModel


type alias InitModel =
    { sessionId : String
    , url : Url.Url
    , key : Nav.Key
    }


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
                Init data ->
                    data.key

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

        ( UrlChanged url, Init data ) ->
            ( Init { data | url = url }, Cmd.none )

        ( ReadyMsg readyMsg, Ready readyModel ) ->
            updateReady readyMsg readyModel |> Tuple.mapFirst (\m -> Ready m)

        ( ReadyMsg _, Init _ ) ->
            ( model, Cmd.none )

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
        Init _ ->
            Debug.log ("Main.view iwth init model")
            Loading.view

        Ready readyModel ->
            Debug.log ("Main.view iwth ready model")
            viewReady readyModel


mapDoc : (a -> PageMsg) -> Browser.Document a -> Browser.Document Msg
mapDoc pageMsg doc =
    { title = doc.title
    , body = List.map (H.map (ReadyMsg << ChangedPage << pageMsg)) doc.body
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