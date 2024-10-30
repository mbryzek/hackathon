module Urls exposing  (..)

index : String
index =
    "/"

accounts : String
accounts =
    "/accounts"

accountsLink : String
accountsLink =
    "/accounts/link"

review : String
review =
    "/review"

forgotPassword : String
forgotPassword =
    "/forgotPassword"

type alias ResetPasswordParams =
    { token : String }

login : String
login =
    "/login"

register : String
register =
    "/register"
