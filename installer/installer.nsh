!macro customInit
  SetShellVarContext current
  IfFileExists "$APPDATA\Yap++\*.*" 0 +2
  RMDir /r "$APPDATA\Yap++"
!macroend