module Components.TransactionCard exposing (Transaction, view)

import Date exposing (Date)
import Html exposing (Html)
import Util.DateFormatter exposing (dateToString)
import Util.Money exposing (usdToString)
import Templates.Card exposing (renderCard, renderCardText)


type alias Transaction =
    { account : String
    , date : Date
    , amount : Float
    , description : String
    }
    

view : Transaction -> Html msg
view transaction =
    renderCard [ renderCardText transaction.account
        , renderCardText (dateToString transaction.date)
        , renderCardText transaction.description
        , renderCardText (usdToString transaction.amount)
    ]
