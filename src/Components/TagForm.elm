module Components.TagForm exposing (Model, Msg, Properties, SingleAllocation, edit, init, isEditing, update, view, inputClass, selectedTags)

import Constants exposing (httpRequestParamsById)
import Dict exposing (Dict)
import Generated.ApiRequest as ApiRequest exposing (ApiRequest, ApiResult)
import Generated.ComBryzekAcumenApi exposing (LineReference, Tag, getTags)
import Generated.ComBryzekAcumenView exposing (LineAllocationView, LineAllocationsForm(..), SimpleAllocation, putLineAllocationViewsById)
import Global exposing (GlobalStateGroup)
import Html exposing (Html, div, input, label, text)
import Html.Attributes exposing (class, for, id, placeholder, type_)
import Html.Events exposing (onClick, onInput)
import Templates.Buttons exposing (renderButtonRequest, renderDefaultCancelLink)
import Templates.Pill exposing (renderPill)
import Util.Misc exposing (emptyStringToMaybe)


type alias Model =
    { global : GlobalStateGroup
    , props : Properties
    , all : Dict String SingleAllocation
    , editIds : List String
    }


type alias SingleAllocation =
    { tag : String
    , tagsRequest : ApiRequest (List Tag)
    , saveRequest : ApiRequest LineAllocationView
    , tags : List String
    }


type Msg
    = TagsResponse LineReference (ApiResult (List Tag))
    | CancelClicked LineReference
    | SaveTag LineReference String
    | AddTag LineReference String
    | RemoveTag LineReference String
    | SubmitTags LineReference (List String)
    | SubmitTagsResponse LineReference (ApiResult LineAllocationView)


type alias Properties =
    { cancel : Bool
    }


init : GlobalStateGroup -> Properties -> ( Model, Cmd Msg )
init global props =
    let
        model : Model
        model =
            { global = global
            , props = props
            , all = Dict.empty
            , editIds = []
            }
    in
    ( model, Cmd.none )


updateAllocation : Model -> LineReference -> (SingleAllocation -> SingleAllocation) -> Model
updateAllocation model line updateFunction =
    { model | all = Dict.insert line.id (updateFunction (getEntry model line)) model.all }


isEditing : Model -> LineAllocationView -> Bool
isEditing model lav =
    List.member lav.id model.editIds


edit : Model -> LineReference -> List SimpleAllocation -> ( Model, Cmd Msg )
edit model line allocations =
    let
        newModel : Model
        newModel =
            updateAllocation model
                line
                (\a ->
                    { a
                        | tagsRequest = Maybe.withDefault ApiRequest.NotAsked (Maybe.map (\_ -> ApiRequest.Loading) (emptyStringToMaybe a.tag))
                        , tag = ""
                        , tags = List.map (\al -> al.tag.name) allocations
                    }
                )
    in
    ( { newModel | editIds = line.id :: newModel.editIds }, apiRequestGetTags newModel line )


closeEdit : Model -> LineReference -> ( Model, Cmd Msg, Maybe LineReference )
closeEdit model line =
    ( { model | editIds = List.filter (\id -> id /= line.id) model.editIds }, Cmd.none, Just line )


modelOnly : Model -> ( Model, Cmd Msg, Maybe LineReference )
modelOnly model =
    ( model, Cmd.none, Nothing )


update : Msg -> Model -> ( Model, Cmd Msg, Maybe LineReference )
update msg model =
    case msg of
        TagsResponse line (Ok tags) ->
            modelOnly (updateAllocation model line (\a -> { a | tagsRequest = ApiRequest.Success tags }))

        TagsResponse line (Err e) ->
            modelOnly (updateAllocation model line (\a -> { a | tagsRequest = ApiRequest.Failure e }))

        CancelClicked line ->
            closeEdit model line

        SaveTag line tag ->
            let
                newModel : Model
                newModel =
                    updateAllocation model line (\a -> { a | tag = tag })
            in
            ( newModel, apiRequestGetTags newModel line, Nothing )

        AddTag line tag ->
            modelOnly (updateAllocation model line (\a -> { a | tag = "", tags = List.append a.tags [ tag ] }))

        RemoveTag line tag ->
            modelOnly (updateAllocation model line (\a -> { a | tags = List.filter (\t -> t /= tag) a.tags }))

        SubmitTags line tags ->
            let
                entry : SingleAllocation
                entry =
                    getEntry model { id = line.id }

                finalTags : List String
                finalTags =
                    if List.isEmpty tags && not (String.isEmpty entry.tag) then
                        [ entry.tag ]

                    else
                        tags
            in
            ( updateAllocation model line (\a -> { a | saveRequest = ApiRequest.Loading })
            , apiRequestPut model line finalTags
            , Nothing
            )

        SubmitTagsResponse line (Ok lav) ->
            let
                newModel : Model
                newModel =
                    updateAllocation model line (\a -> { a | saveRequest = ApiRequest.Success lav })
            in
            closeEdit newModel line

        SubmitTagsResponse line (Err e) ->
            modelOnly (updateAllocation model line (\a -> { a | saveRequest = ApiRequest.Failure e }))


apiRequestPut : Model -> LineReference -> List String -> Cmd Msg
apiRequestPut model line tags =
    putLineAllocationViewsById
        { groupKey = model.global.session.group.key
        , id = line.id
        }
        (LineAllocationsFormLineSplitEqualAllocationsForm
            { tags = tags
            , applyToOtherLineIds = Nothing
            }
        )
        (SubmitTagsResponse line)
        (httpRequestParamsById model.global.session.id)


inputClass : String
inputClass =
    "max-w-96 block w-full rounded-md border-0 p-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-sm placeholder:italic placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"


apiRequestGetTags : Model -> LineReference -> Cmd Msg
apiRequestGetTags model line =
    let
        entry : SingleAllocation
        entry =
            getEntry model line
    in
    case emptyStringToMaybe entry.tag of
        Nothing ->
            Cmd.none

        Just q ->
            getTags
                { groupKey = model.global.session.group.key
                , q = Just q
                , id = Nothing
                , limit = 5
                , offset = 0
                }
                (TagsResponse line)
                (httpRequestParamsById model.global.session.id)


getEntry : Model -> LineReference -> SingleAllocation
getEntry model line =
    Dict.get line.id model.all
        |> Maybe.withDefault
            { tag = ""
            , tagsRequest = ApiRequest.NotAsked
            , saveRequest = ApiRequest.NotAsked
            , tags = []
            }


format : String -> String
format s =
    String.toLower s


type alias MetaTag =
    { name : String
    , isNew : Bool
    }


appendTagIfUnique : List String -> String -> List MetaTag
appendTagIfUnique tags tag =
    let
        metaTags : List MetaTag
        metaTags =
            List.map (\t -> { name = t, isNew = False }) tags
    in
    if List.member (format tag) (List.map format tags) then
        metaTags
    else
        case emptyStringToMaybe tag of
            Just t ->
                List.append metaTags [ { name = t, isNew = True } ]
            Nothing ->
                metaTags


selectedTags : Model -> LineReference -> List String
selectedTags model line =
    let
        entry : SingleAllocation
        entry =
            getEntry model line

    in
    entry.tags


view : Model -> LineReference -> Html Msg
view model line =
    let
        entry : SingleAllocation
        entry =
            getEntry model line

        offeredTags : List MetaTag
        offeredTags =
            appendTagIfUnique 
                (List.map .name (Maybe.withDefault [] (ApiRequest.toMaybe entry.tagsRequest)))
                entry.tag
                |> List.filter (\t -> not (List.member (format t.name) (List.map format entry.tags)))

        -- render selected tags as pills with remove button
        renderSelectedTags : Html Msg
        renderSelectedTags =
            let
                all : List String
                all =
                    selectedTags model line
            in
            if List.isEmpty all then
                text ""
            else
                div [ class "flex flex-wrap gap-2" ]
                    (List.map
                    (\tag -> renderPill (RemoveTag line tag) tag)
                    all
                )

        withSelectedTags : Html Msg -> Html Msg
        withSelectedTags content =
            if List.isEmpty entry.tags then
                content

            else
                div [ class "flex flex-col gap-2" ] [ renderSelectedTags, content ]
    in
    div []
        [ div [ class "mt-4 grid grid-cols-[auto,1fr,auto] gap-4" ]
            [ label [ for "name", class "text-right font-semibold w-auto" ] [ text "Tag:" ]
            , withSelectedTags
                (div [ class "flex gap-x-4" ]
                    [ div []
                        [ input
                            [ id "name"
                            , type_ "text"
                            , class inputClass
                            , placeholder "Search for a tag"
                            , onInput (SaveTag line)
                            ]
                            []
                        , formatOptions line offeredTags
                        ]
                    , div []
                        (List.append
                            [ renderButtonRequest [] entry.saveRequest (SubmitTags line entry.tags) "Save" ]
                            (maybeCancel model line)
                        )
                    ]
                )
            ]
        ]


maybeCancel : Model -> LineReference -> List (Html Msg)
maybeCancel model line =
    if model.props.cancel then
        [ renderDefaultCancelLink (CancelClicked line) ]

    else
        []


formatOptions : LineReference -> List MetaTag -> Html Msg
formatOptions line tags =
    if List.isEmpty tags then
        text ""

    else
        let
            label : MetaTag -> String
            label tag =
                if (tag.isNew) then
                    tag.name ++ " (new)"
                else
                    tag.name
        in
        Html.div
            [ class "mt-2 block w-full rounded-md border-0 p-2 text-gray-900 shadow-sm sm:text-sm sm:leading-6 cursor-pointer"
            ]
            (List.map
                (\tag ->
                    Html.p
                        [ class " hover:underline p-0 mt-1"
                        , onClick (AddTag line tag.name)
                        ]
                        [ text (label tag) ]
                )
                tags
            )
