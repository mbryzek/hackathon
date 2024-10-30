module Templates.Messages exposing (viewNonFieldErrors)

import Generated.ApiRequest as ApiRequest exposing (ApiError(..), ApiRequest)
import Html exposing (Html, div)
import Html.Attributes as Attr
import ValidationError exposing (ValidationError)


apiErrorToHtml : ApiError -> Html msg
apiErrorToHtml error =
    case error of
        ApiErrorSystem msg ->
            renderFailureString msg

        ApiErrorUnsupportedStatusCode code ->
            case code of
                500 ->
                    renderFailureString "System Error"

                _ ->
                    renderFailureString ("Unsupported status code: " ++ String.fromInt code)

        ApiErrorJsonParse msg ->
            renderFailureString msg

        ApiErrorNotFound ->
            renderFailureString "API endpoint not found"

        ApiErrorNotAuthorized ->
            renderFailureString "API endpoint not authorized"

        ApiErrorValidation errors ->
            viewNonFieldValidationErrors errors


renderFailureString : String -> Html msg
renderFailureString error =
    renderFailureHtml (Html.text error)


renderFailureHtml : Html msg -> Html msg
renderFailureHtml error =
    div [ Attr.class "text-red-600 font-semibold" ] [ error ]


renderFailures : List String -> Html msg
renderFailures errors =
    div [ Attr.class "text-red-600 font-semibold" ]
        (List.map Html.text errors)


viewNonFieldErrors : ApiRequest a -> Html msg
viewNonFieldErrors request =
    case request of
        ApiRequest.Failure (ApiErrorValidation errors) ->
            viewNonFieldValidationErrors errors

        ApiRequest.Failure e ->
            apiErrorToHtml e

        _ ->
            Html.text ""


viewNonFieldValidationErrors : List ValidationError -> Html msg
viewNonFieldValidationErrors errors =
    let
        nonFieldErrors : List ValidationError
        nonFieldErrors =
            List.filter (\e -> e.field == Nothing) errors
    in
    renderFailures (List.map .message nonFieldErrors)
