module Page.Index exposing (Model, Msg, init, update, view)

import Components.TagForm as TagFormComponent
import Constants exposing (httpRequestParamsById)
import Dict
import Generated.ApiRequest as ApiRequest exposing (ApiRequest, ApiResult)
import Generated.ComBryzekAcumenView exposing (LineAllocationView, SimpleAllocation, getLineAllocationViews)
import Global exposing (GlobalStateGroup)
import Html exposing (Html, div, table, tbody, td, th, thead, tr, span, p, text, button)
import Html.Attributes as Attr exposing (class, colspan)
import Html.Events exposing (onClick)
import Templates.AppShell exposing (renderAppShellRequest)
import Templates.Buttons exposing (renderTextLink)
import Util.DateFormatter exposing (dateToString)
import Util.Misc exposing (flattenList)
import Util.Money exposing (usdToString)
import Util.LimitOffset exposing (LimitOffset, defaultLimitOffset, replaceOffset)

type alias Model =
    { global : GlobalState
    , lineAllocationViewsRequest : ApiRequest (List LineAllocationView)
    , lineAllocationViewsLimitOffset : LimitOffset
    , tagFormComponent : TagFormComponent.Model
    }


type Msg
    = LineAlllocationViewsResponse (ApiResult (List LineAllocationView))
    | EditClicked LineAllocationView
    | TagFormComponentMsg TagFormComponent.Msg
    | NextPageClicked Int


init : GlobalStateGroup -> ( Model, Cmd Msg )
init global =
    let
        ( tagFormModel, tagFormCmd ) =
            TagFormComponent.init global { cancel = True }

        model : Model
        model =
            { global = global
            , lineAllocationViewsRequest = ApiRequest.Loading
            , lineAllocationViewsLimitOffset = defaultLimitOffset
            , tagFormComponent = tagFormModel
            }
    in
    ( model
    , Cmd.batch
        [ apiRequestGetLines model
        , Cmd.map TagFormComponentMsg tagFormCmd
        ]
    )


apiRequestGetLines : Model -> Cmd Msg
apiRequestGetLines model =
    getLineAllocationViews
        { groupKey = model.global.session.group.key
        , pending = Nothing
        , accountId = Nothing
        , marketplace = Nothing
        , ruleId = Nothing
        , reportingCategoryId = Nothing
        , tagId = Nothing
        , keywords = Nothing
        , limit = model.lineAllocationViewsLimitOffset.limit
        , offset = model.lineAllocationViewsLimitOffset.offset
        }
        LineAlllocationViewsResponse
        (httpRequestParamsById model.global.session.id)

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LineAlllocationViewsResponse (Ok lines) ->
            ( { model | lineAllocationViewsRequest = ApiRequest.Success lines }, Cmd.none )

        LineAlllocationViewsResponse (Err e) ->
            ( { model | lineAllocationViewsRequest = ApiRequest.Failure e }, Cmd.none )

        EditClicked lav ->
            let
                ( newModel, newCmd ) =
                    TagFormComponent.edit model.tagFormComponent { id = lav.id } lav.allocations
            in
            ( { model | tagFormComponent = newModel }, Cmd.map TagFormComponentMsg newCmd )

        TagFormComponentMsg subMsg ->
            let
                ( newModel, newCmd, _ ) =
                    TagFormComponent.update subMsg model.tagFormComponent
            in
            ( { model | tagFormComponent = newModel, lineAllocationViewsRequest = maybeUpdateLines model newModel }, Cmd.map TagFormComponentMsg newCmd )

        NextPageClicked offset ->
            let
                newModel : Model
                newModel = { model | lineAllocationViewsLimitOffset = replaceOffset model.lineAllocationViewsLimitOffset offset
                                    , lineAllocationViewsRequest = ApiRequest.Loading }
            in
            ( newModel, apiRequestGetLines newModel )

maybeUpdateLines : Model -> TagFormComponent.Model -> ApiRequest (List LineAllocationView)
maybeUpdateLines model compModel =
    ApiRequest.map
        (\lines ->
            let
                updated : List LineAllocationView
                updated =
                    Dict.values compModel.all
                        |> List.map (\a -> a.saveRequest)
                        |> List.filterMap ApiRequest.toMaybe

                find : String -> Maybe LineAllocationView
                find id =
                    List.filter (\u -> u.id == id) updated
                        |> List.head
            in
            List.map (\l -> Maybe.withDefault l (find l.id)) lines
        )
        model.lineAllocationViewsRequest


view : Model -> Html Msg
view model =
    renderAppShellRequest model.lineAllocationViewsRequest
        { title = "Transactions"
        , user = model.global.session.user
        }
        (viewLines model)


viewLines : Model -> List LineAllocationView -> List (Html Msg)
viewLines model lines =
    if List.isEmpty lines then
        [ Html.div [ Attr.class "italic" ] [ Html.text "You do not currently have any transactions" ] ]

    else
        [ renderTable model lines
        , renderPagination model
        ]


renderPagination : Model -> Html Msg
renderPagination model =
    div [ class "flex justify-center mt-4" ]
        [ button [ class "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded", onClick (NextPageClicked (model.lineAllocationViewsLimitOffset.offset + model.lineAllocationViewsLimitOffset.limit)) ] [ text "Next" ]
        ]

renderTable : Model -> List LineAllocationView -> Html Msg
renderTable model lines =
    div [ class "rounded-lg bg-white p-6 shadow" ]
        [ div [ class "overflow-x-auto" ]
            [ table [ class "min-w-full bg-white" ]
                [ viewTableHeader
                , tbody [] (flattenList (List.map (viewTransactionRow model) lines))
                ]
            ]
        ]



viewTableHeader : Html Msg
viewTableHeader =
    let
        headerCell : String -> Html Msg
        headerCell title =
            th [ class "border-b-2 border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800" ]
                [ Html.text title ]
    in
    thead []
        [ tr [] (List.map headerCell [ "Date", "Amount", "Account", "Description" ]) ]


cell : String -> Html Msg
cell content =
    htmlCell [ Html.text content ]


htmlCell : List (Html Msg) -> Html Msg
htmlCell contents =
    td [ class "px-4 py-2 text-sm text-gray-700" ] contents


viewTransactionRow : Model -> LineAllocationView -> List (Html Msg)
viewTransactionRow model lav =
    [ renderRow lav
    , renderAllocations model lav
    ]


renderAllocations : Model -> LineAllocationView -> Html Msg
renderAllocations model lav =
    let
        isEditing : Bool
        isEditing =
            TagFormComponent.isEditing model.tagFormComponent lav

        editLink : Html Msg
        editLink =
            if isEditing then
                Html.text ""

            else
                renderTextLink [] (EditClicked lav) "Edit"

        body : List (Html Msg)
        body =
            if isEditing then
                [TagFormComponent.view model.tagFormComponent { id = lav.id } |> Html.map TagFormComponentMsg]

            else
                viewAllocations lav
    in
    tr [] [
        td [colspan 4, class "border-b-2 border-gray-300 pb-4"] [
            div [class "flex pl-10 gap-x-8"] (List.append [editLink] body)
        ]
    ]

renderRow : LineAllocationView -> Html Msg
renderRow line =
    tr [ class "hover:bg-gray-50" ]
        [ cell (dateToString line.date)
        , cell (usdToString line.amount)
        , cell line.account.name
        , cell line.description
        ]


viewAllocations : LineAllocationView -> List (Html Msg)
viewAllocations lav =
    if List.isEmpty lav.allocations then
        [p [class "text-gray-500 italic"] [text "No tags"]]

    else
        List.map viewAllocation lav.allocations


viewAllocation : SimpleAllocation -> Html Msg
viewAllocation allocation =
    span [class "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"] [
        Html.text (usdToString allocation.amount ++ ": " ++ allocation.tag.name)
    ]
