@echo off
echo ========================================
echo  Publicando no GitHub Pages
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Git nao esta instalado!
    echo.
    echo Baixe em: https://git-scm.com/download/win
    echo.
    pause
    exit /b
)

echo [1/5] Inicializando repositorio Git...
git init
if errorlevel 1 (
    echo Repositorio ja existe ou erro ao inicializar
)

echo.
echo [2/5] Adicionando arquivos...
git add .

echo.
echo [3/5] Fazendo commit...
git commit -m "Atualizacao do sistema - %date% %time%"

echo.
echo ========================================
echo  PROXIMOS PASSOS:
echo ========================================
echo.
echo 1. Crie um repositorio no GitHub:
echo    https://github.com/new
echo.
echo 2. Nome sugerido: sistema-gestao
echo    Marque como PUBLIC
echo.
echo 3. Copie o comando que o GitHub mostrar:
echo    git remote add origin https://github.com/SEU-USUARIO/sistema-gestao.git
echo.
echo 4. Execute aqui e pressione ENTER
echo.

set /p remote="Cole o comando 'git remote add origin...' aqui: "
%remote%

echo.
echo [4/5] Configurando branch principal...
git branch -M main

echo.
echo [5/5] Enviando para GitHub...
git push -u origin main

echo.
echo ========================================
echo  CONCLUIDO!
echo ========================================
echo.
echo Agora ative o GitHub Pages:
echo 1. Va em Settings do repositorio
echo 2. Clique em Pages
echo 3. Selecione branch 'main'
echo 4. Clique em Save
echo.
echo Seu site estara em:
echo https://SEU-USUARIO.github.io/sistema-gestao/
echo.
pause
