@echo off
echo --------------------------------------------------------
echo     Copy Porsche Model to Public Assets Folder
echo --------------------------------------------------------
echo.

REM Create the directory if it doesn't exist
mkdir public\assets\models 2>nul

echo Copying Porsche model from Downloads folder...
copy "C:\Users\sebas\Downloads\2020-porsche-718-cayman-gt4\source\2020_porsche_718_cayman_gt4.glb" "public\assets\models\porsche.glb"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Model copied to public\assets\models\porsche.glb
    echo.
    echo You can now run the game with: npx webpack serve --port 8081
) else (
    echo.
    echo ERROR: Could not copy the model file.
    echo Please check that the source file exists at:
    echo C:\Users\sebas\Downloads\2020-porsche-718-cayman-gt4\source\2020_porsche_718_cayman_gt4.glb
)

echo.
pause 