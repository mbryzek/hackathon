module Util.Money exposing (usdToString)

type alias Money =
  {
    amount: Float
    , currency: String
  }

usdToString : Float -> String
usdToString amount =
    toString { amount = amount, currency = "USD" }


toString : Money -> String
toString value =
    let
        formatted : String
        formatted =
            formatMoney value.amount
    in
    if value.currency == "USD" then
        String.append "$" formatted

    else
        formatted ++ " " ++ value.currency


formatMoney : Float -> String
formatMoney originalValue =
    let
        (value, isNegative) =
            if originalValue < 0 then
                ( Basics.abs originalValue, True )
            else
                ( originalValue, False )


        parts : List String
        parts =
            String.split "." (String.fromFloat value)

        ( integralPart, fractionalPart ) =
            case parts of
                [] ->
                    ( String.fromFloat value, "00" )

                f :: [] ->
                    ( f, "00" )

                f :: d :: _ ->
                    if String.length d == 1 then
                        ( f, d ++ "0" )

                    else
                        ( f, d )
    in
    fractionalPart
        |> String.append "."
        |> String.append (formatStringWithCommas integralPart)
        |> (\s -> if isNegative then "-" ++ s else s)


formatStringWithCommas : String -> String
formatStringWithCommas n =
    case String.toInt n of
        Just v ->
            formatWithCommas v

        Nothing ->
            n


formatWithCommas : Int -> String
formatWithCommas n =
    if n < 1000 then
        String.fromInt n

    else
        let
            remainder : Int
            remainder =
                n // 1000

            currentChunk : Int
            currentChunk =
                n - remainder * 1000
        in
        String.concat [ formatWithCommas remainder, ",", String.fromInt currentChunk |> String.padLeft 3 '0' ]
