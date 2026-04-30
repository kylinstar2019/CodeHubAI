; CodeHubAI - NSIS Installer Hooks
; 安装时注册 Windows 资源管理器右键菜单，卸载时清理

!macro NSIS_HOOK_POSTINSTALL
  ; 右键文件夹 → "Open with CodeHubAI"
  WriteRegStr HKCU "Software\Classes\Directory\shell\CodeHubAI" "" "Open with CodeHubAI"
  WriteRegStr HKCU "Software\Classes\Directory\shell\CodeHubAI" "Icon" "$INSTDIR\${MAINBINARYNAME}.exe"
  WriteRegStr HKCU "Software\Classes\Directory\shell\CodeHubAI\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%V"'

  ; 右键文件夹空白处 → "Open with CodeHubAI"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\CodeHubAI" "" "Open with CodeHubAI"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\CodeHubAI" "Icon" "$INSTDIR\${MAINBINARYNAME}.exe"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\CodeHubAI\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%V"'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Directory\shell\CodeHubAI"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\CodeHubAI"
!macroend
