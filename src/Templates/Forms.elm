module Templates.Forms exposing (InputProperties, SelectOption, SelectProperties, input, select)

import Html exposing (Html, Attribute, div, label, text, option)
import Html.Attributes exposing (class, value, selected, attribute, id, name, type_, required, for)
import Html.Events exposing (onInput)

type alias SelectOption =
    {
        value : String
        , label : String

    }

type alias SelectProperties msg =
    {
        label: Maybe String
        , options : List SelectOption
        , onInput : String -> msg
        , selected : Maybe String
    }

select : List (Attribute msg) -> SelectProperties msg -> Html msg
select attributes props =
    let
        withLabel : Html msg -> Html msg
        withLabel contents =
            case props.label of
                Nothing ->
                    contents

                Just l ->
                    div attributes [
                        label [class "block text-sm font-medium text-gray-700"] [text l]
                        , contents
                    ]
    in
    withLabel (
        Html.select 
            [ class "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            , onInput props.onInput
            ] 
            (option 
                [ value ""
                , selected (props.selected == Nothing)
                ] 
                [text "-- Select --"]
            :: (List.map (\t -> 
                option [
                    value t.value
                    , selected (props.selected == Just t.value)
                ] [text t.label]
            ) props.options))
    )


type alias InputProperties msg =
    { id : String
    , label : String
    , type_ : String
    , value : Maybe String
    , required : Bool
    , autocomplete : Maybe String
    , onInput : String -> msg
    , rightLabel: Maybe (Html msg)
    }


input : List (Attribute msg) -> InputProperties msg -> Html msg
input attributes props =
    let
        auto : List (Attribute msg)
        auto =
            case props.autocomplete of
                Nothing ->
                    []

                Just ac ->
                    [ attribute "autocomplete" ac ]

        labelDiv : Html msg
        labelDiv =
            case props.rightLabel of
                Nothing ->
                    genLabel props.id props.label

                Just rl ->
                    div [class "flex items-center justify-between"] [
                        genLabel props.id props.label
                        , div [class "text-sm"] [rl]
                    ]
    in
    div attributes
        [ labelDiv
        , div
            [ class "mt-2"
            ]
            [ Html.input
                (List.concat [
                    [ id props.id
                    , name props.id
                    , type_ props.type_
                    , required props.required
                    , class inputCss
                    , onInput props.onInput
                    ]
                    , (case props.value of
                        Just v -> [value v]
                        Nothing -> []
                    )
                    , auto
                ])
                []
            ]
        ]

genLabel : String -> String -> Html msg
genLabel labelFor title =
    label
        [ for labelFor
        , class "block text-sm font-medium leading-6 text-gray-900"
        ]
        [ text title ]


inputCss : String
inputCss =
    "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
