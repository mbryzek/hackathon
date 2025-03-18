-- codegen.global.state: GlobalStateAnonymousData
module Page.Luna exposing (view)

import Browser
import Html exposing (div, h2, h3, img, li, p, ul)
import Html.Attributes exposing (alt, class, src)
import Templates.Shell as Shell


view : Shell.ViewProps msg -> Browser.Document msg
view props =
    Shell.render props
        "Luna - My Amazing Dog"
        [ div [ class "max-w-3xl mx-auto py-8 flex flex-col md:flex-row gap-8" ]
            [ img
                [ src "https://raw.githubusercontent.com/mbryzek/hackathon-photos/main/luna/luna.jpg"
                , alt "Luna, my beautiful red-coated collie/shepherd mix"
                , class "md:w-1/3 rounded-lg shadow-lg object-cover h-[300px]"
                ]
                []
            , div [ class "md:w-2/3" ]
                [ h2 [ class "text-2xl font-bold text-amber-800 mb-4" ]
                    [ Html.text "Meet Luna" ]
                , p [ class "mb-4" ]
                    [ Html.text "Luna is a stunning collie/Australian shepherd mix with a gorgeous ruby red coat that resembles a fox. Her medium-length fur and elegant appearance make her truly unique, combining the grace and intelligence of both breeds with a striking red coloration that turns heads wherever she goes." ]
                , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ]
                    [ Html.text "Why Dogs Are Our Best Friends" ]
                , ul [ class "list-disc pl-6 space-y-2 mb-6" ]
                    [ li []
                        [ Html.text "Unconditional love and loyalty "
                        , Html.span [ class "inline-block animate-pulse text-2xl" ] [ Html.text "💗" ]
                        ]
                    , li [] [ Html.text "Emotional support and companionship" ]
                    , li [] [ Html.text "Protection and security" ]
                    , li [] [ Html.text "Motivation to stay active and healthy" ]
                    , li [] [ Html.text "A constant source of joy and laughter" ]
                    ]
                , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ]
                    [ Html.text "Understanding Fear of Dogs" ]
                , p [ class "mb-4" ]
                    [ Html.text "While dogs can be wonderful companions, it's important to understand why some people may be cautious around them:" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [] [ Html.text "Past experiences with aggressive dogs" ]
                    , li [] [ Html.text "Lack of exposure to friendly dogs during childhood" ]
                    , li [] [ Html.text "Cultural differences in how dogs are viewed" ]
                    , li [] [ Html.text "Natural caution around large animals" ]
                    , li [] [ Html.text "Concerns about unpredictable behavior" ]
                    ]
                , h3 [ class "text-xl font-bold text-amber-700 mt-6 mb-3" ]
                    [ Html.text "Tips for Overcoming Fear of Dogs" ]
                , p [ class "mb-4" ]
                    [ Html.text "Here are some gentle ways to build confidence around dogs:" ]
                , ul [ class "list-disc pl-6 space-y-2" ]
                    [ li [] [ Html.text "Start with calm, well-trained dogs in controlled environments" ]
                    , li [] [ Html.text "Learn to read dog body language and behavior signals" ]
                    , li [] [ Html.text "Take things at your own pace - there's no rush" ]
                    , li [] [ Html.text "Ask dog owners before interacting with their pets" ]
                    , li [] [ Html.text "Begin with smaller or older dogs who are typically calmer" ]
                    ]
                ]
            ]
        ]
