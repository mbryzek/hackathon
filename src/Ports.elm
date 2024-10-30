port module Ports exposing (clearSession, saveSession)

port saveSession : String -> Cmd msg

port clearSession : () -> Cmd msg
