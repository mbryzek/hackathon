module Generated.ComBryzekAcumenApi exposing (..)

import Iso8601
import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Json.Encode as Encode
import Util.DateFormatter as DateFormatter
import Date exposing (Date)
import Generated.ApiRequest exposing (ApiResult, expectJson, expectUnit)
import Http exposing (Header, Expect)
import Time exposing (Posix)
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


type AccountType
    = AccountTypeInvestment
    | AccountTypeChecking
    | AccountTypeSavings
    | AccountTypeCredit
    | AccountTypeDepository
    | AccountTypeLoan
    | AccountTypeBrokerage
    | AccountTypeOther
    | AccountTypeUnknown

getAllAccountTypes : List AccountType
getAllAccountTypes =
    [ AccountTypeInvestment, AccountTypeChecking, AccountTypeSavings, AccountTypeCredit, AccountTypeDepository, AccountTypeLoan, AccountTypeBrokerage, AccountTypeOther ]

accountTypeToString : AccountType -> String
accountTypeToString instance =
    case instance of
        AccountTypeInvestment ->
            "investment"

        AccountTypeChecking ->
            "checking"

        AccountTypeSavings ->
            "savings"

        AccountTypeCredit ->
            "credit"

        AccountTypeDepository ->
            "depository"

        AccountTypeLoan ->
            "loan"

        AccountTypeBrokerage ->
            "brokerage"

        AccountTypeOther ->
            "other"

        AccountTypeUnknown ->
            "unknown"


accountTypeFromString : String -> AccountType
accountTypeFromString value =
    if value == "investment" then
        AccountTypeInvestment

    else if value == "checking" then
        AccountTypeChecking

    else if value == "savings" then
        AccountTypeSavings

    else if value == "credit" then
        AccountTypeCredit

    else if value == "depository" then
        AccountTypeDepository

    else if value == "loan" then
        AccountTypeLoan

    else if value == "brokerage" then
        AccountTypeBrokerage

    else if value == "other" then
        AccountTypeOther

    else
        AccountTypeUnknown

accountTypeEncoder : AccountType -> Encode.Value
accountTypeEncoder instance =
    Encode.string (accountTypeToString instance)


accountTypeDecoder : Decode.Decoder AccountType
accountTypeDecoder =
    Decode.map accountTypeFromString Decode.string


type Environment
    = EnvironmentProduction
    | EnvironmentSandbox
    | EnvironmentUnknown

getAllEnvironments : List Environment
getAllEnvironments =
    [ EnvironmentProduction, EnvironmentSandbox ]

environmentToString : Environment -> String
environmentToString instance =
    case instance of
        EnvironmentProduction ->
            "production"

        EnvironmentSandbox ->
            "sandbox"

        EnvironmentUnknown ->
            "unknown"


environmentFromString : String -> Environment
environmentFromString value =
    if value == "production" then
        EnvironmentProduction

    else if value == "sandbox" then
        EnvironmentSandbox

    else
        EnvironmentUnknown

environmentEncoder : Environment -> Encode.Value
environmentEncoder instance =
    Encode.string (environmentToString instance)


environmentDecoder : Decode.Decoder Environment
environmentDecoder =
    Decode.map environmentFromString Decode.string


type ImportStatus
    = ImportStatusNew
    | ImportStatusProcessing
    | ImportStatusCompleted
    | ImportStatusFailed
    | ImportStatusUnknown

getAllImportStatuses : List ImportStatus
getAllImportStatuses =
    [ ImportStatusNew, ImportStatusProcessing, ImportStatusCompleted, ImportStatusFailed ]

importStatusToString : ImportStatus -> String
importStatusToString instance =
    case instance of
        ImportStatusNew ->
            "new"

        ImportStatusProcessing ->
            "processing"

        ImportStatusCompleted ->
            "completed"

        ImportStatusFailed ->
            "failed"

        ImportStatusUnknown ->
            "unknown"


importStatusFromString : String -> ImportStatus
importStatusFromString value =
    if value == "new" then
        ImportStatusNew

    else if value == "processing" then
        ImportStatusProcessing

    else if value == "completed" then
        ImportStatusCompleted

    else if value == "failed" then
        ImportStatusFailed

    else
        ImportStatusUnknown

importStatusEncoder : ImportStatus -> Encode.Value
importStatusEncoder instance =
    Encode.string (importStatusToString instance)


importStatusDecoder : Decode.Decoder ImportStatus
importStatusDecoder =
    Decode.map importStatusFromString Decode.string


type LineStatus
    = LineStatusWaiting
    | LineStatusReady
    | LineStatusUnknown

getAllLineStatuses : List LineStatus
getAllLineStatuses =
    [ LineStatusWaiting, LineStatusReady ]

lineStatusToString : LineStatus -> String
lineStatusToString instance =
    case instance of
        LineStatusWaiting ->
            "waiting"

        LineStatusReady ->
            "ready"

        LineStatusUnknown ->
            "unknown"


lineStatusFromString : String -> LineStatus
lineStatusFromString value =
    if value == "waiting" then
        LineStatusWaiting

    else if value == "ready" then
        LineStatusReady

    else
        LineStatusUnknown

lineStatusEncoder : LineStatus -> Encode.Value
lineStatusEncoder instance =
    Encode.string (lineStatusToString instance)


lineStatusDecoder : Decode.Decoder LineStatus
lineStatusDecoder =
    Decode.map lineStatusFromString Decode.string


type Marketplace
    = MarketplaceAmazon
    | MarketplaceUnknown

getAllMarketplaces : List Marketplace
getAllMarketplaces =
    [ MarketplaceAmazon ]

marketplaceToString : Marketplace -> String
marketplaceToString instance =
    case instance of
        MarketplaceAmazon ->
            "amazon"

        MarketplaceUnknown ->
            "unknown"


marketplaceFromString : String -> Marketplace
marketplaceFromString value =
    if value == "amazon" then
        MarketplaceAmazon

    else
        MarketplaceUnknown

marketplaceEncoder : Marketplace -> Encode.Value
marketplaceEncoder instance =
    Encode.string (marketplaceToString instance)


marketplaceDecoder : Decode.Decoder Marketplace
marketplaceDecoder =
    Decode.map marketplaceFromString Decode.string


type SourceKey
    = SourceKeyAmazonItems
    | SourceKeyAmazonOrdersAndShipments
    | SourceKeyChaseTransactions
    | SourceKeyPersonalCapitalTransactions
    | SourceKeyQuickBooksTransactions
    | SourceKeySynchronyTransactions
    | SourceKeySimpleFinTransactions
    | SourceKeyUnknown

getAllSourceKeys : List SourceKey
getAllSourceKeys =
    [ SourceKeyAmazonItems, SourceKeyAmazonOrdersAndShipments, SourceKeyChaseTransactions, SourceKeyPersonalCapitalTransactions, SourceKeyQuickBooksTransactions, SourceKeySynchronyTransactions, SourceKeySimpleFinTransactions ]

sourceKeyToString : SourceKey -> String
sourceKeyToString instance =
    case instance of
        SourceKeyAmazonItems ->
            "amazon_items"

        SourceKeyAmazonOrdersAndShipments ->
            "amazon_orders_and_shipments"

        SourceKeyChaseTransactions ->
            "chase_transactions"

        SourceKeyPersonalCapitalTransactions ->
            "personal_capital_transactions"

        SourceKeyQuickBooksTransactions ->
            "quick_books_transactions"

        SourceKeySynchronyTransactions ->
            "synchrony_transactions"

        SourceKeySimpleFinTransactions ->
            "simple_fin_transactions"

        SourceKeyUnknown ->
            "unknown"


sourceKeyFromString : String -> SourceKey
sourceKeyFromString value =
    if value == "amazon_items" then
        SourceKeyAmazonItems

    else if value == "amazon_orders_and_shipments" then
        SourceKeyAmazonOrdersAndShipments

    else if value == "chase_transactions" then
        SourceKeyChaseTransactions

    else if value == "personal_capital_transactions" then
        SourceKeyPersonalCapitalTransactions

    else if value == "quick_books_transactions" then
        SourceKeyQuickBooksTransactions

    else if value == "synchrony_transactions" then
        SourceKeySynchronyTransactions

    else if value == "simple_fin_transactions" then
        SourceKeySimpleFinTransactions

    else
        SourceKeyUnknown

sourceKeyEncoder : SourceKey -> Encode.Value
sourceKeyEncoder instance =
    Encode.string (sourceKeyToString instance)


sourceKeyDecoder : Decode.Decoder SourceKey
sourceKeyDecoder =
    Decode.map sourceKeyFromString Decode.string


type alias Account =
  {
    id: String
    , name: String
    , type_: Maybe AccountType
    , subtype: Maybe String
    , last4: Maybe String
  }

accountEncoder : Account -> Encode.Value
accountEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "name", Encode.string instance.name )
            , ( "type", encodeOptional accountTypeEncoder instance.type_ )
            , ( "subtype", encodeOptional Encode.string instance.subtype )
            , ( "last4", encodeOptional Encode.string instance.last4 )

        ]


accountDecoder : Decode.Decoder Account
accountDecoder =
        Decode.succeed Account
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "name" Decode.string
            |> Pipeline.optional "type" (Decode.nullable accountTypeDecoder) Nothing
            |> Pipeline.optional "subtype" (Decode.nullable Decode.string) Nothing
            |> Pipeline.optional "last4" (Decode.nullable Decode.string) Nothing


type alias AccountForm =
  {
    name: String
    , type_: Maybe AccountType
    , subtype: Maybe String
    , last4: Maybe String
  }

accountFormEncoder : AccountForm -> Encode.Value
accountFormEncoder instance =
        Encode.object
        [
            ( "name", Encode.string instance.name )
            , ( "type", encodeOptional accountTypeEncoder instance.type_ )
            , ( "subtype", encodeOptional Encode.string instance.subtype )
            , ( "last4", encodeOptional Encode.string instance.last4 )

        ]


accountFormDecoder : Decode.Decoder AccountForm
accountFormDecoder =
        Decode.succeed AccountForm
            |> Pipeline.required "name" Decode.string
            |> Pipeline.optional "type" (Decode.nullable accountTypeDecoder) Nothing
            |> Pipeline.optional "subtype" (Decode.nullable Decode.string) Nothing
            |> Pipeline.optional "last4" (Decode.nullable Decode.string) Nothing


type alias AccountReference =
  {
    id: String
  }

accountReferenceEncoder : AccountReference -> Encode.Value
accountReferenceEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )

        ]


accountReferenceDecoder : Decode.Decoder AccountReference
accountReferenceDecoder =
        Decode.succeed AccountReference
            |> Pipeline.required "id" Decode.string


type alias AccountSuggestion =
  {
    id: String
    , type_: Maybe AccountType
    , organization: Maybe OrganizationSummary
    , name: String
    , subtype: Maybe String
    , last4: Maybe String
  }

accountSuggestionEncoder : AccountSuggestion -> Encode.Value
accountSuggestionEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "type", encodeOptional accountTypeEncoder instance.type_ )
            , ( "organization", encodeOptional organizationSummaryEncoder instance.organization )
            , ( "name", Encode.string instance.name )
            , ( "subtype", encodeOptional Encode.string instance.subtype )
            , ( "last4", encodeOptional Encode.string instance.last4 )

        ]


accountSuggestionDecoder : Decode.Decoder AccountSuggestion
accountSuggestionDecoder =
        Decode.succeed AccountSuggestion
            |> Pipeline.required "id" Decode.string
            |> Pipeline.optional "type" (Decode.nullable accountTypeDecoder) Nothing
            |> Pipeline.optional "organization" (Decode.nullable organizationSummaryDecoder) Nothing
            |> Pipeline.required "name" Decode.string
            |> Pipeline.optional "subtype" (Decode.nullable Decode.string) Nothing
            |> Pipeline.optional "last4" (Decode.nullable Decode.string) Nothing


type alias AccountSuggestionLinkAccountForm =
  {
    accountId: String
  }

accountSuggestionLinkAccountFormEncoder : AccountSuggestionLinkAccountForm -> Encode.Value
accountSuggestionLinkAccountFormEncoder instance =
        Encode.object
        [
            ( "account_id", Encode.string instance.accountId )

        ]


accountSuggestionLinkAccountFormDecoder : Decode.Decoder AccountSuggestionLinkAccountForm
accountSuggestionLinkAccountFormDecoder =
        Decode.succeed AccountSuggestionLinkAccountForm
            |> Pipeline.required "account_id" Decode.string


type alias Allocation =
  {
    id: String
    , line: LineReference
    , tag: AllocationTag
    , amount: Float
  }

allocationEncoder : Allocation -> Encode.Value
allocationEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "line", lineReferenceEncoder instance.line )
            , ( "tag", allocationTagEncoder instance.tag )
            , ( "amount", Encode.float instance.amount )

        ]


allocationDecoder : Decode.Decoder Allocation
allocationDecoder =
        Decode.succeed Allocation
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "line" lineReferenceDecoder
            |> Pipeline.required "tag" allocationTagDecoder
            |> Pipeline.required "amount" Decode.float


type alias AllocationTag =
  {
    id: String
    , name: String
  }

allocationTagEncoder : AllocationTag -> Encode.Value
allocationTagEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "name", Encode.string instance.name )

        ]


allocationTagDecoder : Decode.Decoder AllocationTag
allocationTagDecoder =
        Decode.succeed AllocationTag
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "name" Decode.string


type alias Auth =
  {
    placeholder: Maybe String
  }

authEncoder : Auth -> Encode.Value
authEncoder instance =
        Encode.object
        [
            ( "placeholder", encodeOptional Encode.string instance.placeholder )

        ]


authDecoder : Decode.Decoder Auth
authDecoder =
        Decode.succeed Auth
            |> Pipeline.optional "placeholder" (Decode.nullable Decode.string) Nothing


type alias Avatar =
  {
    url: String
  }

avatarEncoder : Avatar -> Encode.Value
avatarEncoder instance =
        Encode.object
        [
            ( "url", Encode.string instance.url )

        ]


avatarDecoder : Decode.Decoder Avatar
avatarDecoder =
        Decode.succeed Avatar
            |> Pipeline.required "url" Decode.string


type alias DefaultReviewer =
  {
    user: UserReference
  }

defaultReviewerEncoder : DefaultReviewer -> Encode.Value
defaultReviewerEncoder instance =
        Encode.object
        [
            ( "user", userReferenceEncoder instance.user )

        ]


defaultReviewerDecoder : Decode.Decoder DefaultReviewer
defaultReviewerDecoder =
        Decode.succeed DefaultReviewer
            |> Pipeline.required "user" userReferenceDecoder


type alias DefaultReviewerForm =
  {
    userId: String
  }

defaultReviewerFormEncoder : DefaultReviewerForm -> Encode.Value
defaultReviewerFormEncoder instance =
        Encode.object
        [
            ( "user_id", Encode.string instance.userId )

        ]


defaultReviewerFormDecoder : Decode.Decoder DefaultReviewerForm
defaultReviewerFormDecoder =
        Decode.succeed DefaultReviewerForm
            |> Pipeline.required "user_id" Decode.string


type alias Group =
  {
    id: String
    , key: String
    , defaultReviewer: Maybe UserReference
  }

groupEncoder : Group -> Encode.Value
groupEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "key", Encode.string instance.key )
            , ( "default_reviewer", encodeOptional userReferenceEncoder instance.defaultReviewer )

        ]


groupDecoder : Decode.Decoder Group
groupDecoder =
        Decode.succeed Group
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "key" Decode.string
            |> Pipeline.optional "default_reviewer" (Decode.nullable userReferenceDecoder) Nothing


type alias GroupForm =
  {
    name: String
  }

groupFormEncoder : GroupForm -> Encode.Value
groupFormEncoder instance =
        Encode.object
        [
            ( "name", Encode.string instance.name )

        ]


groupFormDecoder : Decode.Decoder GroupForm
groupFormDecoder =
        Decode.succeed GroupForm
            |> Pipeline.required "name" Decode.string


type alias GroupSummary =
  {
    key: String
  }

groupSummaryEncoder : GroupSummary -> Encode.Value
groupSummaryEncoder instance =
        Encode.object
        [
            ( "key", Encode.string instance.key )

        ]


groupSummaryDecoder : Decode.Decoder GroupSummary
groupSummaryDecoder =
        Decode.succeed GroupSummary
            |> Pipeline.required "key" Decode.string


type alias Import =
  {
    id: String
    , account: Maybe AccountReference
    , user: User
    , sourceKey: Maybe SourceKey
    , status: ImportStatus
    , url: String
    , errors: Maybe ImportErrors
    , createdAt: Posix
  }

importEncoder : Import -> Encode.Value
importEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "account", encodeOptional accountReferenceEncoder instance.account )
            , ( "user", userEncoder instance.user )
            , ( "source_key", encodeOptional sourceKeyEncoder instance.sourceKey )
            , ( "status", importStatusEncoder instance.status )
            , ( "url", Encode.string instance.url )
            , ( "errors", encodeOptional importErrorsEncoder instance.errors )
            , ( "created_at", Iso8601.encode instance.createdAt )

        ]


importDecoder : Decode.Decoder Import
importDecoder =
        Decode.succeed Import
            |> Pipeline.required "id" Decode.string
            |> Pipeline.optional "account" (Decode.nullable accountReferenceDecoder) Nothing
            |> Pipeline.required "user" userDecoder
            |> Pipeline.optional "source_key" (Decode.nullable sourceKeyDecoder) Nothing
            |> Pipeline.required "status" importStatusDecoder
            |> Pipeline.required "url" Decode.string
            |> Pipeline.optional "errors" (Decode.nullable importErrorsDecoder) Nothing
            |> Pipeline.required "created_at" Iso8601.decoder


type alias ImportError =
  {
    message: String
  }

importErrorEncoder : ImportError -> Encode.Value
importErrorEncoder instance =
        Encode.object
        [
            ( "message", Encode.string instance.message )

        ]


importErrorDecoder : Decode.Decoder ImportError
importErrorDecoder =
        Decode.succeed ImportError
            |> Pipeline.required "message" Decode.string


type alias ImportErrors =
  {
    count: Int
  }

importErrorsEncoder : ImportErrors -> Encode.Value
importErrorsEncoder instance =
        Encode.object
        [
            ( "count", Encode.int instance.count )

        ]


importErrorsDecoder : Decode.Decoder ImportErrors
importErrorsDecoder =
        Decode.succeed ImportErrors
            |> Pipeline.required "count" Decode.int


type alias ImportForm =
  {
    url: String
    , sourceKey: Maybe SourceKey
    , accountId: Maybe String
  }

importFormEncoder : ImportForm -> Encode.Value
importFormEncoder instance =
        Encode.object
        [
            ( "url", Encode.string instance.url )
            , ( "source_key", encodeOptional sourceKeyEncoder instance.sourceKey )
            , ( "account_id", encodeOptional Encode.string instance.accountId )

        ]


importFormDecoder : Decode.Decoder ImportForm
importFormDecoder =
        Decode.succeed ImportForm
            |> Pipeline.required "url" Decode.string
            |> Pipeline.optional "source_key" (Decode.nullable sourceKeyDecoder) Nothing
            |> Pipeline.optional "account_id" (Decode.nullable Decode.string) Nothing


type alias Line =
  {
    id: String
    , transaction: TransactionReference
    , position: Int
    , status: LineStatus
    , description: String
    , category: Maybe String
    , amount: Float
  }

lineEncoder : Line -> Encode.Value
lineEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "transaction", transactionReferenceEncoder instance.transaction )
            , ( "position", Encode.int instance.position )
            , ( "status", lineStatusEncoder instance.status )
            , ( "description", Encode.string instance.description )
            , ( "category", encodeOptional Encode.string instance.category )
            , ( "amount", Encode.float instance.amount )

        ]


lineDecoder : Decode.Decoder Line
lineDecoder =
        Decode.succeed Line
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "transaction" transactionReferenceDecoder
            |> Pipeline.required "position" Decode.int
            |> Pipeline.required "status" lineStatusDecoder
            |> Pipeline.required "description" Decode.string
            |> Pipeline.optional "category" (Decode.nullable Decode.string) Nothing
            |> Pipeline.required "amount" Decode.float


type alias LineReference =
  {
    id: String
  }

lineReferenceEncoder : LineReference -> Encode.Value
lineReferenceEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )

        ]


lineReferenceDecoder : Decode.Decoder LineReference
lineReferenceDecoder =
        Decode.succeed LineReference
            |> Pipeline.required "id" Decode.string


type alias LoginForm =
  {
    email: String
    , password: String
  }

loginFormEncoder : LoginForm -> Encode.Value
loginFormEncoder instance =
        Encode.object
        [
            ( "email", Encode.string instance.email )
            , ( "password", Encode.string instance.password )

        ]


loginFormDecoder : Decode.Decoder LoginForm
loginFormDecoder =
        Decode.succeed LoginForm
            |> Pipeline.required "email" Decode.string
            |> Pipeline.required "password" Decode.string


type alias Membership =
  {
    id: String
    , group: GroupSummary
    , user: User
  }

membershipEncoder : Membership -> Encode.Value
membershipEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "group", groupSummaryEncoder instance.group )
            , ( "user", userEncoder instance.user )

        ]


membershipDecoder : Decode.Decoder Membership
membershipDecoder =
        Decode.succeed Membership
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "group" groupSummaryDecoder
            |> Pipeline.required "user" userDecoder


type alias MembershipForm =
  {
    groupKey: String
    , userId: String
  }

membershipFormEncoder : MembershipForm -> Encode.Value
membershipFormEncoder instance =
        Encode.object
        [
            ( "group_key", Encode.string instance.groupKey )
            , ( "user_id", Encode.string instance.userId )

        ]


membershipFormDecoder : Decode.Decoder MembershipForm
membershipFormDecoder =
        Decode.succeed MembershipForm
            |> Pipeline.required "group_key" Decode.string
            |> Pipeline.required "user_id" Decode.string


type alias OrganizationSummary =
  {
    name: String
  }

organizationSummaryEncoder : OrganizationSummary -> Encode.Value
organizationSummaryEncoder instance =
        Encode.object
        [
            ( "name", Encode.string instance.name )

        ]


organizationSummaryDecoder : Decode.Decoder OrganizationSummary
organizationSummaryDecoder =
        Decode.succeed OrganizationSummary
            |> Pipeline.required "name" Decode.string


type alias Password =
  {
    placeholder: Maybe String
  }

passwordEncoder : Password -> Encode.Value
passwordEncoder instance =
        Encode.object
        [
            ( "placeholder", encodeOptional Encode.string instance.placeholder )

        ]


passwordDecoder : Decode.Decoder Password
passwordDecoder =
        Decode.succeed Password
            |> Pipeline.optional "placeholder" (Decode.nullable Decode.string) Nothing


type alias RegistrationForm =
  {
    email: String
    , password: String
    , name: Maybe String
    , avatar: Maybe Avatar
  }

registrationFormEncoder : RegistrationForm -> Encode.Value
registrationFormEncoder instance =
        Encode.object
        [
            ( "email", Encode.string instance.email )
            , ( "password", Encode.string instance.password )
            , ( "name", encodeOptional Encode.string instance.name )
            , ( "avatar", encodeOptional avatarEncoder instance.avatar )

        ]


registrationFormDecoder : Decode.Decoder RegistrationForm
registrationFormDecoder =
        Decode.succeed RegistrationForm
            |> Pipeline.required "email" Decode.string
            |> Pipeline.required "password" Decode.string
            |> Pipeline.optional "name" (Decode.nullable Decode.string) Nothing
            |> Pipeline.optional "avatar" (Decode.nullable avatarDecoder) Nothing


type alias ResetPasswordForm =
  {
    email: String
  }

resetPasswordFormEncoder : ResetPasswordForm -> Encode.Value
resetPasswordFormEncoder instance =
        Encode.object
        [
            ( "email", Encode.string instance.email )

        ]


resetPasswordFormDecoder : Decode.Decoder ResetPasswordForm
resetPasswordFormDecoder =
        Decode.succeed ResetPasswordForm
            |> Pipeline.required "email" Decode.string


type alias Rule =
  {
    id: String
    , query: String
    , tags: List RuleTag
  }

ruleEncoder : Rule -> Encode.Value
ruleEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "query", Encode.string instance.query )
            , ( "tags", (Encode.list ruleTagEncoder) instance.tags )

        ]


ruleDecoder : Decode.Decoder Rule
ruleDecoder =
        Decode.succeed Rule
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "query" Decode.string
            |> Pipeline.required "tags" (Decode.list ruleTagDecoder)


type alias RuleForm =
  {
    query: String
    , tags: List RuleTagForm
  }

ruleFormEncoder : RuleForm -> Encode.Value
ruleFormEncoder instance =
        Encode.object
        [
            ( "query", Encode.string instance.query )
            , ( "tags", (Encode.list ruleTagFormEncoder) instance.tags )

        ]


ruleFormDecoder : Decode.Decoder RuleForm
ruleFormDecoder =
        Decode.succeed RuleForm
            |> Pipeline.required "query" Decode.string
            |> Pipeline.required "tags" (Decode.list ruleTagFormDecoder)


type alias RuleReference =
  {
    id: String
  }

ruleReferenceEncoder : RuleReference -> Encode.Value
ruleReferenceEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )

        ]


ruleReferenceDecoder : Decode.Decoder RuleReference
ruleReferenceDecoder =
        Decode.succeed RuleReference
            |> Pipeline.required "id" Decode.string


type alias RuleTag =
  {
    tag: String
    , fraction: String
  }

ruleTagEncoder : RuleTag -> Encode.Value
ruleTagEncoder instance =
        Encode.object
        [
            ( "tag", Encode.string instance.tag )
            , ( "fraction", Encode.string instance.fraction )

        ]


ruleTagDecoder : Decode.Decoder RuleTag
ruleTagDecoder =
        Decode.succeed RuleTag
            |> Pipeline.required "tag" Decode.string
            |> Pipeline.required "fraction" Decode.string


type alias RuleTagForm =
  {
    tag: String
    , fraction: String
  }

ruleTagFormEncoder : RuleTagForm -> Encode.Value
ruleTagFormEncoder instance =
        Encode.object
        [
            ( "tag", Encode.string instance.tag )
            , ( "fraction", Encode.string instance.fraction )

        ]


ruleTagFormDecoder : Decode.Decoder RuleTagForm
ruleTagFormDecoder =
        Decode.succeed RuleTagForm
            |> Pipeline.required "tag" Decode.string
            |> Pipeline.required "fraction" Decode.string


type alias RuleUsage =
  {
    rule: RuleReference
    , countLines: Int
    , totalAllocated: Float
  }

ruleUsageEncoder : RuleUsage -> Encode.Value
ruleUsageEncoder instance =
        Encode.object
        [
            ( "rule", ruleReferenceEncoder instance.rule )
            , ( "count_lines", Encode.int instance.countLines )
            , ( "total_allocated", Encode.float instance.totalAllocated )

        ]


ruleUsageDecoder : Decode.Decoder RuleUsage
ruleUsageDecoder =
        Decode.succeed RuleUsage
            |> Pipeline.required "rule" ruleReferenceDecoder
            |> Pipeline.required "count_lines" Decode.int
            |> Pipeline.required "total_allocated" Decode.float


type alias SampleTransaction =
  {
    date: Date
    , description: String
    , amount: Float
  }

sampleTransactionEncoder : SampleTransaction -> Encode.Value
sampleTransactionEncoder instance =
        Encode.object
        [
            ( "date", DateFormatter.encode instance.date )
            , ( "description", Encode.string instance.description )
            , ( "amount", Encode.float instance.amount )

        ]


sampleTransactionDecoder : Decode.Decoder SampleTransaction
sampleTransactionDecoder =
        Decode.succeed SampleTransaction
            |> Pipeline.required "date" DateFormatter.decoder
            |> Pipeline.required "description" Decode.string
            |> Pipeline.required "amount" Decode.float


type alias Session =
  {
    id: String
    , user: User
    , group: Maybe GroupSummary
  }

sessionEncoder : Session -> Encode.Value
sessionEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "user", userEncoder instance.user )
            , ( "group", encodeOptional groupSummaryEncoder instance.group )

        ]


sessionDecoder : Decode.Decoder Session
sessionDecoder =
        Decode.succeed Session
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "user" userDecoder
            |> Pipeline.optional "group" (Decode.nullable groupSummaryDecoder) Nothing


type alias SetPasswordForm =
  {
    token: String
    , password: String
  }

setPasswordFormEncoder : SetPasswordForm -> Encode.Value
setPasswordFormEncoder instance =
        Encode.object
        [
            ( "token", Encode.string instance.token )
            , ( "password", Encode.string instance.password )

        ]


setPasswordFormDecoder : Decode.Decoder SetPasswordForm
setPasswordFormDecoder =
        Decode.succeed SetPasswordForm
            |> Pipeline.required "token" Decode.string
            |> Pipeline.required "password" Decode.string


type alias Tag =
  {
    id: String
    , name: String
  }

tagEncoder : Tag -> Encode.Value
tagEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "name", Encode.string instance.name )

        ]


tagDecoder : Decode.Decoder Tag
tagDecoder =
        Decode.succeed Tag
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "name" Decode.string


type alias TagForm =
  {
    name: String
  }

tagFormEncoder : TagForm -> Encode.Value
tagFormEncoder instance =
        Encode.object
        [
            ( "name", Encode.string instance.name )

        ]


tagFormDecoder : Decode.Decoder TagForm
tagFormDecoder =
        Decode.succeed TagForm
            |> Pipeline.required "name" Decode.string


type alias Transaction =
  {
    id: String
    , group: GroupSummary
    , account: AccountReference
    , date: Date
    , source: TransactionSource
    , marketplace: Maybe Marketplace
    , description: String
    , amount: Float
  }

transactionEncoder : Transaction -> Encode.Value
transactionEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "group", groupSummaryEncoder instance.group )
            , ( "account", accountReferenceEncoder instance.account )
            , ( "date", DateFormatter.encode instance.date )
            , ( "source", transactionSourceEncoder instance.source )
            , ( "marketplace", encodeOptional marketplaceEncoder instance.marketplace )
            , ( "description", Encode.string instance.description )
            , ( "amount", Encode.float instance.amount )

        ]


transactionDecoder : Decode.Decoder Transaction
transactionDecoder =
        Decode.succeed Transaction
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "group" groupSummaryDecoder
            |> Pipeline.required "account" accountReferenceDecoder
            |> Pipeline.required "date" DateFormatter.decoder
            |> Pipeline.required "source" transactionSourceDecoder
            |> Pipeline.optional "marketplace" (Decode.nullable marketplaceDecoder) Nothing
            |> Pipeline.required "description" Decode.string
            |> Pipeline.required "amount" Decode.float


type alias TransactionReference =
  {
    id: String
  }

transactionReferenceEncoder : TransactionReference -> Encode.Value
transactionReferenceEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )

        ]


transactionReferenceDecoder : Decode.Decoder TransactionReference
transactionReferenceDecoder =
        Decode.succeed TransactionReference
            |> Pipeline.required "id" Decode.string


type alias TransactionSource =
  {
    key: SourceKey
    , category: Maybe String
  }

transactionSourceEncoder : TransactionSource -> Encode.Value
transactionSourceEncoder instance =
        Encode.object
        [
            ( "key", sourceKeyEncoder instance.key )
            , ( "category", encodeOptional Encode.string instance.category )

        ]


transactionSourceDecoder : Decode.Decoder TransactionSource
transactionSourceDecoder =
        Decode.succeed TransactionSource
            |> Pipeline.required "key" sourceKeyDecoder
            |> Pipeline.optional "category" (Decode.nullable Decode.string) Nothing


type alias User =
  {
    id: String
    , email: String
    , name: Maybe String
    , avatar: Maybe Avatar
  }

userEncoder : User -> Encode.Value
userEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )
            , ( "email", Encode.string instance.email )
            , ( "name", encodeOptional Encode.string instance.name )
            , ( "avatar", encodeOptional avatarEncoder instance.avatar )

        ]


userDecoder : Decode.Decoder User
userDecoder =
        Decode.succeed User
            |> Pipeline.required "id" Decode.string
            |> Pipeline.required "email" Decode.string
            |> Pipeline.optional "name" (Decode.nullable Decode.string) Nothing
            |> Pipeline.optional "avatar" (Decode.nullable avatarDecoder) Nothing


type alias UserReference =
  {
    id: String
  }

userReferenceEncoder : UserReference -> Encode.Value
userReferenceEncoder instance =
        Encode.object
        [
            ( "id", Encode.string instance.id )

        ]


userReferenceDecoder : Decode.Decoder UserReference
userReferenceDecoder =
        Decode.succeed UserReference
            |> Pipeline.required "id" Decode.string


type alias GetAccountsProps =
    {groupKey : String
    , id : Maybe (List String)
    , limit : Int
    , offset : Int
    , sort : String
    }

getAccounts : GetAccountsProps -> (ApiResult (List Account) -> msg) -> HttpRequestParams -> Cmd msg
getAccounts props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/accounts") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]
                    ++ [string "sort" props.sort]

            ))
        , expect = expectJson msg (Decode.list accountDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetAccountsByIdProps =
    {groupKey : String
    , id : String
    }

getAccountsById : GetAccountsByIdProps -> (ApiResult Account -> msg) -> HttpRequestParams -> Cmd msg
getAccountsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/accounts/" ++ props.id
        , expect = expectJson msg accountDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postAccounts : String -> AccountForm -> (ApiResult Account -> msg) -> HttpRequestParams -> Cmd msg
postAccounts groupKey body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/accounts"
        , expect = expectJson msg accountDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (accountFormEncoder body)
        }


type alias PutAccountsByIdProps =
    {groupKey : String
    , id : String
    }

putAccountsById : PutAccountsByIdProps -> AccountForm -> (ApiResult Account -> msg) -> HttpRequestParams -> Cmd msg
putAccountsById props body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/accounts/" ++ props.id
        , expect = expectJson msg accountDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (accountFormEncoder body)
        }


type alias DeleteAccountsByIdProps =
    {groupKey : String
    , id : String
    }

deleteAccountsById : DeleteAccountsByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteAccountsById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/accounts/" ++ props.id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getAccountSuggestionsPending : String -> (ApiResult (List AccountSuggestion) -> msg) -> HttpRequestParams -> Cmd msg
getAccountSuggestionsPending groupKey msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/account/suggestions/pending"
        , expect = expectJson msg (Decode.list accountSuggestionDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetAccountSuggestionsTransactionsByIdProps =
    {groupKey : String
    , id : String
    }

getAccountSuggestionsTransactionsById : GetAccountSuggestionsTransactionsByIdProps -> (ApiResult (List SampleTransaction) -> msg) -> HttpRequestParams -> Cmd msg
getAccountSuggestionsTransactionsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id ++ "/transactions"
        , expect = expectJson msg (Decode.list sampleTransactionDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias PostAccountSuggestionsAcceptExistingByIdProps =
    {groupKey : String
    , id : String
    }

postAccountSuggestionsAcceptExistingById : PostAccountSuggestionsAcceptExistingByIdProps -> AccountSuggestionLinkAccountForm -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
postAccountSuggestionsAcceptExistingById props body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id ++ "/accept/existing"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (accountSuggestionLinkAccountFormEncoder body)
        }


type alias PostAccountSuggestionsAcceptCreateByIdProps =
    {groupKey : String
    , id : String
    }

postAccountSuggestionsAcceptCreateById : PostAccountSuggestionsAcceptCreateByIdProps -> AccountForm -> (ApiResult Account -> msg) -> HttpRequestParams -> Cmd msg
postAccountSuggestionsAcceptCreateById props body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id ++ "/accept/create"
        , expect = expectJson msg accountDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (accountFormEncoder body)
        }


type alias PutAccountSuggestionsIgnoreByIdProps =
    {groupKey : String
    , id : String
    }

putAccountSuggestionsIgnoreById : PutAccountSuggestionsIgnoreByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
putAccountSuggestionsIgnoreById props msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id ++ "/ignore"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias DeleteAccountSuggestionsIgnoreByIdProps =
    {groupKey : String
    , id : String
    }

deleteAccountSuggestionsIgnoreById : DeleteAccountSuggestionsIgnoreByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteAccountSuggestionsIgnoreById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id ++ "/ignore"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias DeleteAccountSuggestionsByIdProps =
    {groupKey : String
    , id : String
    }

deleteAccountSuggestionsById : DeleteAccountSuggestionsByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteAccountSuggestionsById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/account/suggestions/" ++ props.id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetGroupsProps =
    {id : Maybe (List String)
    , key : Maybe (List String)
    , limit : Int
    , offset : Int
    }

getGroups : GetGroupsProps -> (ApiResult (List Group) -> msg) -> HttpRequestParams -> Cmd msg
getGroups props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append "/groups" (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ (Maybe.withDefault [] (Maybe.map (\v3 -> (List.map (\v4 -> (string "key" v4)) v3)) props.key))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list groupDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getGroupsByKey : String -> (ApiResult Group -> msg) -> HttpRequestParams -> Cmd msg
getGroupsByKey key msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/groups/" ++ key
        , expect = expectJson msg groupDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


putGroupsByKey : String -> GroupForm -> (ApiResult Group -> msg) -> HttpRequestParams -> Cmd msg
putGroupsByKey key body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/groups/" ++ key
        , expect = expectJson msg groupDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (groupFormEncoder body)
        }


putGroupsDefaultReviewerByKey : String -> DefaultReviewerForm -> (ApiResult Group -> msg) -> HttpRequestParams -> Cmd msg
putGroupsDefaultReviewerByKey key body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/groups/" ++ key ++ "/default/reviewer"
        , expect = expectJson msg groupDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (defaultReviewerFormEncoder body)
        }


deleteGroupsByKey : String -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteGroupsByKey key msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/groups/" ++ key
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetImportsProps =
    {groupKey : String
    , id : Maybe (List String)
    , limit : Int
    , offset : Int
    }

getImports : GetImportsProps -> (ApiResult (List Import) -> msg) -> HttpRequestParams -> Cmd msg
getImports props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/imports") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list importDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetImportsByIdProps =
    {groupKey : String
    , id : String
    }

getImportsById : GetImportsByIdProps -> (ApiResult Import -> msg) -> HttpRequestParams -> Cmd msg
getImportsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/imports/" ++ props.id
        , expect = expectJson msg importDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetImportsErrorsByIdProps =
    {groupKey : String
    , id : String
    , limit : Int
    , offset : Int
    }

getImportsErrorsById : GetImportsErrorsByIdProps -> (ApiResult (List ImportError) -> msg) -> HttpRequestParams -> Cmd msg
getImportsErrorsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/imports/" ++ props.id ++ "/errors") (toQuery(
                            [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list importErrorDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias DeleteImportsByIdProps =
    {groupKey : String
    , id : String
    }

deleteImportsById : DeleteImportsByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteImportsById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/imports/" ++ props.id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postImports : String -> ImportForm -> (ApiResult Import -> msg) -> HttpRequestParams -> Cmd msg
postImports groupKey body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/imports"
        , expect = expectJson msg importDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (importFormEncoder body)
        }


type alias GetLinesProps =
    {id : Maybe (List String)
    , limit : Int
    , offset : Int
    }

getLines : GetLinesProps -> (ApiResult (List Line) -> msg) -> HttpRequestParams -> Cmd msg
getLines props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append "/lines" (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list lineDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getLinesById : String -> (ApiResult Line -> msg) -> HttpRequestParams -> Cmd msg
getLinesById id msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/lines/" ++ id
        , expect = expectJson msg lineDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetMembershipsProps =
    {id : Maybe (List String)
    , groupId : Maybe String
    , groupKey : Maybe String
    , limit : Int
    , offset : Int
    }

getMemberships : GetMembershipsProps -> (ApiResult (List Membership) -> msg) -> HttpRequestParams -> Cmd msg
getMemberships props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append "/memberships" (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ (Maybe.withDefault [] (Maybe.map (\v3 -> [(string "group_id" v3)]) props.groupId))
                    ++ (Maybe.withDefault [] (Maybe.map (\v4 -> [(string "group_key" v4)]) props.groupKey))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list membershipDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getMembershipsById : String -> (ApiResult Membership -> msg) -> HttpRequestParams -> Cmd msg
getMembershipsById id msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/memberships/" ++ id
        , expect = expectJson msg membershipDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postMemberships : MembershipForm -> (ApiResult Membership -> msg) -> HttpRequestParams -> Cmd msg
postMemberships body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/memberships"
        , expect = expectJson msg membershipDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (membershipFormEncoder body)
        }


deleteMembershipsById : String -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteMembershipsById id msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/memberships/" ++ id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postPasswordsResetToken : ResetPasswordForm -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
postPasswordsResetToken body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/passwords/reset/token"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (resetPasswordFormEncoder body)
        }


postPasswordsReset : SetPasswordForm -> (ApiResult Session -> msg) -> HttpRequestParams -> Cmd msg
postPasswordsReset body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/passwords/reset"
        , expect = expectJson msg sessionDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (setPasswordFormEncoder body)
        }


type alias GetRulesProps =
    {groupKey : String
    , id : Maybe (List String)
    , limit : Int
    , offset : Int
    }

getRules : GetRulesProps -> (ApiResult (List Rule) -> msg) -> HttpRequestParams -> Cmd msg
getRules props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/rules") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list ruleDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetRulesByIdProps =
    {groupKey : String
    , id : String
    }

getRulesById : GetRulesByIdProps -> (ApiResult Rule -> msg) -> HttpRequestParams -> Cmd msg
getRulesById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/rules/" ++ props.id
        , expect = expectJson msg ruleDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias DeleteRulesByIdProps =
    {groupKey : String
    , id : String
    }

deleteRulesById : DeleteRulesByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteRulesById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/rules/" ++ props.id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postRules : String -> RuleForm -> (ApiResult Rule -> msg) -> HttpRequestParams -> Cmd msg
postRules groupKey body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/rules"
        , expect = expectJson msg ruleDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (ruleFormEncoder body)
        }


type alias PutRulesByIdProps =
    {groupKey : String
    , id : String
    }

putRulesById : PutRulesByIdProps -> RuleForm -> (ApiResult Rule -> msg) -> HttpRequestParams -> Cmd msg
putRulesById props body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/rules/" ++ props.id
        , expect = expectJson msg ruleDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (ruleFormEncoder body)
        }


type alias GetRulesUsageByIdProps =
    {groupKey : String
    , id : String
    }

getRulesUsageById : GetRulesUsageByIdProps -> (ApiResult RuleUsage -> msg) -> HttpRequestParams -> Cmd msg
getRulesUsageById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/rules/" ++ props.id ++ "/usage"
        , expect = expectJson msg ruleUsageDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getSessionsCurrent : (ApiResult Session -> msg) -> HttpRequestParams -> Cmd msg
getSessionsCurrent msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/sessions/current"
        , expect = expectJson msg sessionDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postSessionsLogin : LoginForm -> (ApiResult Session -> msg) -> HttpRequestParams -> Cmd msg
postSessionsLogin body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/sessions/login"
        , expect = expectJson msg sessionDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (loginFormEncoder body)
        }


postSessionsLogout : (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
postSessionsLogout msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/sessions/logout"
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postSessionsRegister : RegistrationForm -> (ApiResult Session -> msg) -> HttpRequestParams -> Cmd msg
postSessionsRegister body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/sessions/register"
        , expect = expectJson msg sessionDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (registrationFormEncoder body)
        }


type alias GetTagsProps =
    {groupKey : String
    , id : Maybe (List String)
    , q : Maybe String
    , limit : Int
    , offset : Int
    }

getTags : GetTagsProps -> (ApiResult (List Tag) -> msg) -> HttpRequestParams -> Cmd msg
getTags props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ String.append ("/g/" ++ props.groupKey ++ "/tags") (toQuery(
                            (Maybe.withDefault [] (Maybe.map (\v1 -> (List.map (\v2 -> (string "id" v2)) v1)) props.id))
                    ++ (Maybe.withDefault [] (Maybe.map (\v3 -> [(string "q" v3)]) props.q))
                    ++ [ string "limit" (String.fromInt props.limit) ]
                    ++ [ string "offset" (String.fromInt props.offset) ]

            ))
        , expect = expectJson msg (Decode.list tagDecoder)
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


type alias GetTagsByIdProps =
    {groupKey : String
    , id : String
    }

getTagsById : GetTagsByIdProps -> (ApiResult Tag -> msg) -> HttpRequestParams -> Cmd msg
getTagsById props msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/tags/" ++ props.id
        , expect = expectJson msg tagDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


postTags : String -> TagForm -> (ApiResult Tag -> msg) -> HttpRequestParams -> Cmd msg
postTags groupKey body msg params =
    Http.request
        { method = "POST"
        , url = params.apiHost ++ "/g/" ++ groupKey ++ "/tags"
        , expect = expectJson msg tagDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (tagFormEncoder body)
        }


type alias PutTagsByIdProps =
    {groupKey : String
    , id : String
    }

putTagsById : PutTagsByIdProps -> TagForm -> (ApiResult Tag -> msg) -> HttpRequestParams -> Cmd msg
putTagsById props body msg params =
    Http.request
        { method = "PUT"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/tags/" ++ props.id
        , expect = expectJson msg tagDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.jsonBody (tagFormEncoder body)
        }


type alias DeleteTagsByIdProps =
    {groupKey : String
    , id : String
    }

deleteTagsById : DeleteTagsByIdProps -> (ApiResult () -> msg) -> HttpRequestParams -> Cmd msg
deleteTagsById props msg params =
    Http.request
        { method = "DELETE"
        , url = params.apiHost ++ "/g/" ++ props.groupKey ++ "/tags/" ++ props.id
        , expect = expectUnit msg
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }


getUsersById : String -> (ApiResult User -> msg) -> HttpRequestParams -> Cmd msg
getUsersById id msg params =
    Http.request
        { method = "GET"
        , url = params.apiHost ++ "/users/" ++ id
        , expect = expectJson msg userDecoder
        , headers = params.headers
        , timeout = Nothing
        , tracker = Nothing
        , body = Http.emptyBody
        }