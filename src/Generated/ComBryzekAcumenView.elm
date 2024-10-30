module Generated.ComBryzekAcumenView exposing (..)

import Generated.ComBryzekAcumenApi as ComBryzekAcumenApi
import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Json.Encode as Encode
import Util.DateFormatter as DateFormatter
import Date exposing (Date)
import Generated.ApiRequest exposing (ApiResult, expectJson, expectUnit)
import Http exposing (Header, Expect)
import Url.Builder exposing (string, toQuery)




encodeOptional : (a -> Encode.Value) -> Maybe a -> Encode.Value
encodeOptional encoder value =
    case value of
        Just v ->
            encoder v

        Nothing ->
            Encode.null

boolToString : Bool -> String
boolToString value =
    if value then
        "true"

    else
        "false"

type alias HttpRequestParams =
     { apiHost: String
       , headers : List Header
     }


type alias LineAllocationView =
  {
    id: String
    , account: SimpleAccount
    , createdAt: Date
    , date: Date
    , amount: Float
    , source: ComBryzekAcumenApi.SourceKey
    , marketplace: Maybe ComBryzekAcumenApi.Marketplace
    , status: ComBryzekAcumenApi.LineStatus
    , description: String
    , sourceLineCategory: Maybe String
    , allocations: List SimpleAllocation
  }

lineAllocationViewEncoder : LineAllocationView -> Encode.Value
lineAllocationViewEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "account", simpleAccountEncoder instance.account )
            , ( "created_at", DateFormatter.encode instance.createdAt )
            , ( "date", DateFormatter.encode instance.date )
            , ( "amount", Encode.float instance.amount )
            , ( "source", ComBryzekAcumenApi.sourceKeyEncoder instance.source )
            , ( "marketplace", encodeOptional ComBryzekAcumenApi.marketplaceEncoder instance.marketplace )
            , ( "status", ComBryzekAcumenApi.lineStatusEncoder instance.status )
            , ( "description", Encode.string instance.description )
            , ( "source_line_category", encodeOptional Encode.string instance.sourceLineCategory )
            , ( "allocations", (Encode.list simpleAllocationEncoder) instance.allocations )

        ]


lineAllocationViewDecoder : Decode.Decoder LineAllocationView
lineAllocationViewDecoder =
        Decode.succeed LineAllocationView
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "account" simpleAccountDecoder
            |> Pipeline.required "created_at" DateFormatter.decoder
            |> Pipeline.required "date" DateFormatter.decoder
            |> Pipeline.required "amount" Decode.float
            |> Pipeline.required "source" ComBryzekAcumenApi.sourceKeyDecoder
            |> Pipeline.optional "marketplace" (Decode.nullable ComBryzekAcumenApi.marketplaceDecoder) Nothing
            |> Pipeline.required "status" ComBryzekAcumenApi.lineStatusDecoder
            |> Pipeline.required "description" Decode.string
            |> Pipeline.optional "source_line_category" (Decode.nullable Decode.string) Nothing
            |> Pipeline.required "allocations" (Decode.list simpleAllocationDecoder)


type alias LineReview =
  {
    line: LineAllocationView
    , otherPendingLineIds: List String
    , similarAllocatedLine: Maybe LineAllocationView
    , reassignTo: List LineReviewReassignTo
  }

lineReviewEncoder : LineReview -> Encode.Value
lineReviewEncoder instance =
        Encode.object
        [
            ( "line", lineAllocationViewEncoder instance.line )
            , ( "other_pending_line_ids", (Encode.list Encode.string) instance.otherPendingLineIds )
            , ( "similar_allocated_line", encodeOptional lineAllocationViewEncoder instance.similarAllocatedLine )
            , ( "reassign_to", (Encode.list lineReviewReassignToEncoder) instance.reassignTo )

        ]


lineReviewDecoder : Decode.Decoder LineReview
lineReviewDecoder =
        Decode.succeed LineReview
            |> Pipeline.required "line" lineAllocationViewDecoder
            |> Pipeline.required "other_pending_line_ids" (Decode.list Decode.string)
            |> Pipeline.optional "similar_allocated_line" (Decode.nullable lineAllocationViewDecoder) Nothing
            |> Pipeline.required "reassign_to" (Decode.list lineReviewReassignToDecoder)


type alias LineReviewDelegation =
  {
    placeholder: Maybe String
  }

lineReviewDelegationEncoder : LineReviewDelegation -> Encode.Value
lineReviewDelegationEncoder instance =
        Encode.object
        [
            ( "placeholder", encodeOptional Encode.string instance.placeholder )

        ]


lineReviewDelegationDecoder : Decode.Decoder LineReviewDelegation
lineReviewDelegationDecoder =
        Decode.succeed LineReviewDelegation
            |> Pipeline.optional "placeholder" (Decode.nullable Decode.string) Nothing


type alias LineReviewDelegationForm =
  {
    lineId: String
    , assignToUserId: String
  }

lineReviewDelegationFormEncoder : LineReviewDelegationForm -> Encode.Value
lineReviewDelegationFormEncoder instance =
        Encode.object
        [
            ( "line_id", Encode.string instance.lineId )
            , ( "assign_to_user_id", Encode.string instance.assignToUserId )

        ]


lineReviewDelegationFormDecoder : Decode.Decoder LineReviewDelegationForm
lineReviewDelegationFormDecoder =
        Decode.succeed LineReviewDelegationForm
            |> Pipeline.required "line_id" Decode.string
            |> Pipeline.required "assign_to_user_id" Decode.string


type alias LineReviewReassignTo =
  {
    user: ComBryzekAcumenApi.User
  }

lineReviewReassignToEncoder : LineReviewReassignTo -> Encode.Value
lineReviewReassignToEncoder instance =
        Encode.object
        [
            ( "user", ComBryzekAcumenApi.userEncoder instance.user )

        ]


lineReviewReassignToDecoder : Decode.Decoder LineReviewReassignTo
lineReviewReassignToDecoder =
        Decode.succeed LineReviewReassignTo
            |> Pipeline.required "user" ComBryzekAcumenApi.userDecoder


type alias LineReviewSummary =
  {
    countPendingLines: Int
  }

lineReviewSummaryEncoder : LineReviewSummary -> Encode.Value
lineReviewSummaryEncoder instance =
        Encode.object
        [
            ( "count_pending_lines", Encode.int instance.countPendingLines )

        ]


lineReviewSummaryDecoder : Decode.Decoder LineReviewSummary
lineReviewSummaryDecoder =
        Decode.succeed LineReviewSummary
            |> Pipeline.required "count_pending_lines" Decode.int


type alias LineSpecificAllocationForm =
  {
    amount: Float
    , tag: String
  }

lineSpecificAllocationFormEncoder : LineSpecificAllocationForm -> Encode.Value
lineSpecificAllocationFormEncoder instance =
        Encode.object
        [
            ( "amount", Encode.float instance.amount )
            , ( "tag", Encode.string instance.tag )

        ]


lineSpecificAllocationFormDecoder : Decode.Decoder LineSpecificAllocationForm
lineSpecificAllocationFormDecoder =
        Decode.succeed LineSpecificAllocationForm
            |> Pipeline.required "amount" Decode.float
            |> Pipeline.required "tag" Decode.string


type alias LineSpecificAllocationsForm =
  {
    allocations: List LineSpecificAllocationForm
    , applyToOtherLineIds: Maybe (List String)
  }

lineSpecificAllocationsFormEncoder : LineSpecificAllocationsForm -> Encode.Value
lineSpecificAllocationsFormEncoder instance =
        Encode.object
        [
            ( "allocations", (Encode.list lineSpecificAllocationFormEncoder) instance.allocations )
            , ( "apply_to_other_line_ids", encodeOptional (Encode.list Encode.string) instance.applyToOtherLineIds )

        ]


lineSpecificAllocationsFormDecoder : Decode.Decoder LineSpecificAllocationsForm
lineSpecificAllocationsFormDecoder =
        Decode.succeed LineSpecificAllocationsForm
            |> Pipeline.required "allocations" (Decode.list lineSpecificAllocationFormDecoder)
            |> Pipeline.optional "apply_to_other_line_ids" (Decode.nullable ((Decode.list Decode.string))) Nothing


type alias LineSplitEqualAllocationsForm =
  {
    tags: List String
    , applyToOtherLineIds: Maybe (List String)
  }

lineSplitEqualAllocationsFormEncoder : LineSplitEqualAllocationsForm -> Encode.Value
lineSplitEqualAllocationsFormEncoder instance =
        Encode.object
        [
            ( "tags", (Encode.list Encode.string) instance.tags )
            , ( "apply_to_other_line_ids", encodeOptional (Encode.list Encode.string) instance.applyToOtherLineIds )

        ]


lineSplitEqualAllocationsFormDecoder : Decode.Decoder LineSplitEqualAllocationsForm
lineSplitEqualAllocationsFormDecoder =
        Decode.succeed LineSplitEqualAllocationsForm
            |> Pipeline.required "tags" (Decode.list Decode.string)
            |> Pipeline.optional "apply_to_other_line_ids" (Decode.nullable ((Decode.list Decode.string))) Nothing


type alias SimpleAccount =
  {
    name: String
  }

simpleAccountEncoder : SimpleAccount -> Encode.Value
simpleAccountEncoder instance =
        Encode.object
        [
            ( "name", Encode.string instance.name )

        ]


simpleAccountDecoder : Decode.Decoder SimpleAccount
simpleAccountDecoder =
        Decode.succeed SimpleAccount
            |> Pipeline.required "name" Decode.string


type alias SimpleAllocation =
  {
    tag: TagSummary
    , amount: Float
  }

simpleAllocationEncoder : SimpleAllocation -> Encode.Value
simpleAllocationEncoder instance =
        Encode.object
        [
            ( "tag", tagSummaryEncoder instance.tag )
            , ( "amount", Encode.float instance.amount )

        ]


simpleAllocationDecoder : Decode.Decoder SimpleAllocation
simpleAllocationDecoder =
        Decode.succeed SimpleAllocation
            |> Pipeline.required "tag" tagSummaryDecoder
            |> Pipeline.required "amount" Decode.float


type alias TagSummary =
  {
    id: String
    , name: String
  }

tagSummaryEncoder : TagSummary -> Encode.Value
tagSummaryEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "name", Encode.string instance.name )

        ]


tagSummaryDecoder : Decode.Decoder TagSummary
tagSummaryDecoder =
        Decode.succeed TagSummary
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "name" Decode.string


type alias TagView =
  {
    tag: TagSummary
    , count: Int
    , total: Float
  }

tagViewEncoder : TagView -> Encode.Value
tagViewEncoder instance =
        Encode.object
        [
            ( "tag", tagSummaryEncoder instance.tag )
            , ( "count", Encode.int instance.count )
            , ( "total", Encode.float instance.total )

        ]


tagViewDecoder : Decode.Decoder TagView
tagViewDecoder =
        Decode.succeed TagView
            |> Pipeline.required "tag" tagSummaryDecoder
            |> Pipeline.required "count" Decode.int
            |> Pipeline.required "total" Decode.float


type LineAllocationsForm =
    LineAllocationsFormLineSplitEqualAllocationsForm LineSplitEqualAllocationsForm
    | LineAllocationsFormLineSpecificAllocationsForm LineSpecificAllocationsForm

lineAllocationsFormDecoder : Decode.Decoder LineAllocationsForm
lineAllocationsFormDecoder =
    let
        decodeDiscriminator : Decode.Decoder String
        decodeDiscriminator =
            Decode.field "discriminator" Decode.string

    in
    decodeDiscriminator |> Decode.andThen (\disc ->
            case disc of
                "line_split_equal_allocations_form" ->
                    lineSplitEqualAllocationsFormDecoder |> Decode.map LineAllocationsFormLineSplitEqualAllocationsForm

                "line_specific_allocations_form" ->
                    lineSpecificAllocationsFormDecoder |> Decode.map LineAllocationsFormLineSpecificAllocationsForm

                _ ->
                    Decode.fail ("Unknown discriminator: " ++ disc)
        )


lineAllocationsFormEncoder : LineAllocationsForm -> Encode.Value
lineAllocationsFormEncoder instance =
    case instance of
        LineAllocationsFormLineSplitEqualAllocationsForm i ->
            addDiscriminator "line_split_equal_allocations_form" (lineSplitEqualAllocationsFormEncoder i)
        LineAllocationsFormLineSpecificAllocationsForm i ->
            addDiscriminator "line_specific_allocations_form" (lineSpecificAllocationsFormEncoder i)


type alias GetLineAllocationViewsProps =
    {groupKey : String
    , pending : Maybe Bool
    , accountId : Maybe (List String)
    , marketplace : Maybe (List ComBryzekAcumenApi.Marketplace)
    , ruleId : Maybe String
    , reportingCategoryId : Maybe String
    , tagId : Maybe (List String)
    , keywords : Maybe String
    , limit : Int
    , offset : Int
    }

getLineAllocationViews : GetLineAllocationViewsProps -> (ApiResult (List LineAllocationView) -> msg) -> HttpRequestParams -> Cmd msg
getLineAllocationViews props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/views/line/allocations") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> [(string "pending" (boolToString v1))]) props.pending))
                    ++ (Maybe.withDefault [] (Maybe.map (\v2 -> (List.map (\v3 -> (string "account_id" v3)) v2)) props.accountId))
                    ++ (Maybe.withDefault [] (Maybe.map (\v4 -> (List.map (\v5 -> (string "marketplace" (ComBryzekAcumenApi.marketplaceToString v5))) v4)) props.marketplace))
                    ++ (Maybe.withDefault [] (Maybe.map (\v6 -> [(string "rule_id" v6)]) props.ruleId))
                    ++ (Maybe.withDefault [] (Maybe.map (\v7 -> [(string "reporting_category_id" v7)]) props.reportingCategoryId))
                    ++ (Maybe.withDefault [] (Maybe.map (\v8 -> (List.map (\v9 -> (string "tag_id" v9)) v8)) props.tagId))
                    ++ (Maybe.withDefault [] (Maybe.map (\v10 -> [(string "keywords" v10)]) props.keywords))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list lineAllocationViewDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetLineAllocationViewsByIdProps =
    {groupKey : String
    , id : String
    }

getLineAllocationViewsById : GetLineAllocationViewsByIdProps -> (ApiResult LineAllocationView -> msg) -> HttpRequestParams -> Cmd msg
getLineAllocationViewsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/views/line/allocations/" ++ props.id
        , expect = expectJson msg lineAllocationViewDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias PutLineAllocationViewsByIdProps =
    {groupKey : String
    , id : String
    }

putLineAllocationViewsById : PutLineAllocationViewsByIdProps -> LineAllocationsForm -> (ApiResult LineAllocationView -> msg) -> HttpRequestParams -> Cmd msg
putLineAllocationViewsById props body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/views/line/allocations/" ++ props.id
        , expect = expectJson msg lineAllocationViewDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (lineAllocationsFormEncoder body)
        }


type alias GetLineReviewsProps =
    {groupKey : String
    , pendingReviewAssignedToUserId : Maybe String
    , limit : Int
    , offset : Int
    }

getLineReviews : GetLineReviewsProps -> (ApiResult (List LineReview) -> msg) -> HttpRequestParams -> Cmd msg
getLineReviews props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/views/line/reviews") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> [(string "pending_review_assigned_to_user_id" v1)]) props.pendingReviewAssignedToUserId))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list lineReviewDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postLineReviewDelegations : String -> LineReviewDelegationForm -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
postLineReviewDelegations groupKey body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/views/line/review/delegations"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (lineReviewDelegationFormEncoder body)
        }


type alias GetLineReviewSummariesProps =
    {groupKey : String
    , pendingReviewAssignedToUserId : Maybe String
    }

getLineReviewSummaries : GetLineReviewSummariesProps -> (ApiResult LineReviewSummary -> msg) -> HttpRequestParams -> Cmd msg
getLineReviewSummaries props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/views/line/review/summary") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> [(string "pending_review_assigned_to_user_id" v1)]) props.pendingReviewAssignedToUserId))

            ))
        , expect = expectJson msg lineReviewSummaryDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getTagViews : String -> (ApiResult (List TagView) -> msg) -> HttpRequestParams -> Cmd msg
getTagViews groupKey msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/views/tags"
        , expect = expectJson msg (Decode.list tagViewDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetTagViewsByIdProps =
    {groupKey : String
    , id : String
    }

getTagViewsById : GetTagViewsByIdProps -> (ApiResult TagView -> msg) -> HttpRequestParams -> Cmd msg
getTagViewsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/views/tags/" ++ props.id
        , expect = expectJson msg tagViewDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }



addDiscriminator : String -> Encode.Value -> Encode.Value
addDiscriminator disc value =
    case Decode.decodeValue (Decode.keyValuePairs Decode.value) value of
        Ok pairs ->
            Encode.object (("discriminator", Encode.string disc) :: pairs)

        Err _ ->
            -- If encoding fails, we'll just return the original value
            value