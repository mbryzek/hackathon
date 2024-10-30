module Util.DateFormatter exposing (dateToString, decoder, encode)

import Date exposing (Date, day, fromIsoString, month, toIsoString, year)
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Time exposing (Month(..))


dateToString : Date -> String
dateToString date =
    toShortMonth (month date) ++ " " ++ String.fromInt (day date) ++ ", " ++ String.fromInt (year date)


decoder : Decoder Date
decoder =
    Decode.string
        |> Decode.andThen
            (\str ->
                case fromIsoString str of
                    Err e ->
                        Decode.fail e

                    Ok date ->
                        Decode.succeed date
            )


encode : Date -> Encode.Value
encode date =
    Encode.string (toIsoString date)


toShortMonth : Month -> String
toShortMonth month =
    case month of
        Jan ->
            "Jan"

        Feb ->
            "Feb"

        Mar ->
            "Mar"

        Apr ->
            "Apr"

        May ->
            "May"

        Jun ->
            "Jun"

        Jul ->
            "Jul"

        Aug ->
            "Aug"

        Sep ->
            "Sep"

        Oct ->
            "Oct"

        Nov ->
            "Nov"

        Dec ->
            "Dec"
