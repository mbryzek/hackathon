module Constants exposing (logoSvg, defaultHttpRequestParams, httpRequestParams, httpRequestParamsById)

import Generated.ComBryzekAcumenApi exposing (HttpRequestParams)
import Html exposing (Html)
import Global exposing (SessionState(..))
import Http
import Svg exposing (svg, rect, line)
import Svg.Attributes exposing (..)

logoSvg : Html msg
logoSvg =
  svg [ width "150", height "100", viewBox "0 0 150 100" ]
        [ -- Stylized 'A'
          Svg.path [ d "M 50 80 L 75 20 L 100 80 Z", fill "none", stroke "black", strokeWidth "5" ] []
          
          -- Horizontal bar at the bottom of the 'A'
        , line [ x1 "60", y1 "80", x2 "90", y2 "80", stroke "black", strokeWidth "5" ] []

          -- Simple bars representing a bar chart on the left
        , rect [ x "20", y "60", width "10", height "20", fill "black" ] []
        , rect [ x "35", y "50", width "10", height "30", fill "black" ] []
        , rect [ x "50", y "40", width "10", height "40", fill "black" ] []
        ]

defaultHttpRequestParams : HttpRequestParams
defaultHttpRequestParams =
    httpRequestParams SessionLoggedOut

httpRequestParams : SessionState -> HttpRequestParams
httpRequestParams session =
  case session of
      SessionLoggedOut ->
          httpRequestParamsByOptionalId Nothing

      SessionLoggedIn s ->
        httpRequestParamsById s.id

httpRequestParamsById : String -> HttpRequestParams
httpRequestParamsById sessionId =
  httpRequestParamsByOptionalId (Just sessionId)

httpRequestParamsByOptionalId : Maybe String -> HttpRequestParams
httpRequestParamsByOptionalId sessionId =
    let
      headers : List Http.Header
      headers =
        case sessionId of
          Nothing ->
            []

          Just sid ->
            [ Http.header "acumen_session_id" sid ]
    in
     { apiHost = "http://localhost:9200"
       , headers = headers
     }
