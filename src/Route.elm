module Route exposing (Route(..), parseUrl)

import Url exposing (Url)
import Url.Parser exposing (..)
import Urls


type Route
    = PageIndex
    | PageReview
    | PageAccountsIndex
    | PageLogin
    | PageLogout
    | PageRegister
    | PageForgotPassword
    | PageResetPassword Urls.ResetPasswordParams
    | PageAccountsLink


parseUrl : Url -> Maybe Route
parseUrl url =
    parse matchRoute url


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map PageIndex top
        , map PageReview (s "review")
        , map PageAccountsIndex (s "accounts")
        , map PageLogin (s "login")
        , map PageRegister (s "register")
        , map PageLogout (s "logout")
        , map PageForgotPassword (s "forgotPassword")
        , map PageResetPassword (s "resetPassword" </> resetPasswordParams)
        , map PageAccountsLink (s "accounts" </> s "link")
        ]


resetPasswordParams : Parser (Urls.ResetPasswordParams -> a) a
resetPasswordParams =
    custom "ResetPasswordParams" <|
        \t ->
            Just { token = t }
