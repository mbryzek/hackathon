module Util.Misc exposing (emptyStringToMaybe, flattenList)


emptyStringToMaybe : String -> Maybe String
emptyStringToMaybe v =
    if String.isEmpty v then
        Nothing

    else
        Just v

flattenList : List (List a) -> List a
flattenList items =
    doFlattenList items []


doFlattenList : List (List a) -> List a -> List a
doFlattenList remaining all =
    case List.head remaining of
        Nothing ->
            all

        Just item ->
            doFlattenList (List.drop 1 remaining) (List.append all item)