@echo off
echo --------------------------------------------------------
echo     Fix Porsche Model Loading
echo --------------------------------------------------------
echo.

REM Create the directory if it doesn't exist
mkdir public\assets\models 2>nul

echo Current contents of public\assets\models directory:
dir public\assets\models
echo.

echo Copying Porsche model from Downloads folder...
copy "C:\Users\sebas\Downloads\2020-porsche-718-cayman-gt4\source\2020_porsche_718_cayman_gt4.glb" "public\assets\models\porsche.glb"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Model copied to public\assets\models\porsche.glb
    echo.
    dir public\assets\models
    echo.
    echo Restart the server with: npx webpack serve --port 8081
) else (
    echo.
    echo ERROR: Could not copy the model file.
    echo Please check that the source file exists at:
    echo C:\Users\sebas\Downloads\2020-porsche-718-cayman-gt4\source\2020_porsche_718_cayman_gt4.glb
    echo.
    echo Let's check if the source file exists:
    dir "C:\Users\sebas\Downloads\2020-porsche-718-cayman-gt4\source"
)

echo.
pause 