module Util.LimitOffset exposing (LimitOffset, defaultLimitOffset, replaceOffset)


type alias LimitOffset =
    { limit : Int, offset : Int }


defaultLimitOffset : LimitOffset
defaultLimitOffset =
    { limit = 25, offset = 0 }


replaceOffset : LimitOffset -> Int -> LimitOffset
replaceOffset lo newOffset =
    { lo | offset = newOffset }
