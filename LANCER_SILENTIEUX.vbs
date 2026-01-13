Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the directory of this VBS script
CurrentDirectory = FSO.GetParentFolderName(WScript.ScriptFullName)

' Build path to the BAT file
BatPath = CurrentDirectory & "\LANCER_SUPER_APP.bat"

' Run the BAT file invisibly (0)
' We surround the path with quotes (chr(34)) to handle spaces in folder names
WshShell.Run "cmd /c " & chr(34) & chr(34) & BatPath & chr(34) & chr(34), 0, False
Set WshShell = Nothing
Set FSO = Nothing
