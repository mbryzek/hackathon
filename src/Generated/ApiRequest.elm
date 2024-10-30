

module Generated.ApiRequest exposing (ApiError(..), ApiRequest(..), ApiResult, map, expectJson, expectUnit, toMaybe)

import Http
import Json.Decode as Decode exposing (Decoder, decodeString, errorToString)
import ValidationError exposing (ValidationError, validationErrorsDecoder)


type ApiRequest a
    = NotAsked
    | Loading
    | Failure ApiError
    | Success a


type alias ApiResult a =
    Result ApiError a


type ApiError
    = ApiErrorSystem String
    | ApiErrorUnsupportedStatusCode Int
    | ApiErrorJsonParse String
    | ApiErrorNotFound
    | ApiErrorNotAuthorized
    | ApiErrorValidation (List ValidationError)


mapApiResponse : Http.Response String -> (String -> ApiResult a) -> ApiResult a
mapApiResponse httpResponse f =
    case httpResponse of
        Http.BadUrl_ url ->
            Err (ApiErrorSystem (String.append "Bad URL: " url))

        Http.Timeout_ ->
            Err (ApiErrorSystem "Timeout")

        Http.NetworkError_ ->
            Err (ApiErrorSystem "NetworkError")

        Http.BadStatus_ metadata body ->
            case metadata.statusCode of
                401 ->
                    Err ApiErrorNotAuthorized

                404 ->
                    Err ApiErrorNotFound

                422 ->
                    case decodeString validationErrorsDecoder body of
                        Ok errors ->
                            Err (ApiErrorValidation errors)

                        Err e ->
                            Err (ApiErrorSystem ("422 - unable to parse body as validation error: " ++ errorToString e))

                code ->
                    Err (ApiErrorUnsupportedStatusCode code)

        Http.GoodStatus_ _ body ->
            case f body of
                Ok obj ->
                    Ok obj

                Err e ->
                    Err e

expectJson : (ApiResult a -> msg) -> Decode.Decoder a  -> Http.Expect msg
expectJson msg decoder =
    Http.expectStringResponse msg (convertJson decoder)


expectUnit : (ApiResult () -> msg) -> Http.Expect msg
expectUnit msg =
    Http.expectStringResponse msg convertUnit


convertJson : Decoder a -> Http.Response String -> ApiResult a
convertJson decoder httpResponse =
    mapApiResponse httpResponse
        (\body ->
            case decodeString decoder body of
                Ok obj ->
                    Ok obj

                Err e ->
                    Err (ApiErrorJsonParse (errorToString e))
        )


convertUnit : Http.Response String -> ApiResult ()
convertUnit httpResponse =
    mapApiResponse httpResponse (\_ -> Ok ())

map : (a -> b) -> ApiRequest a -> ApiRequest b
map f request =
    case request of
        Success value ->
            Success (f value)

        Loading ->
            Loading

        NotAsked ->
            NotAsked

        Failure error ->
            Failure error

toMaybe : ApiRequest a -> Maybe a
toMaybe request =
    case request of
        Success value ->
            Just value

        _ ->
            Nothing
