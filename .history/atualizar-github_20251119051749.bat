@echo off
echo ========================================
echo  Atualizando GitHub - Future Tech
echo ========================================
echo.

REM Verificar se Git esta instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Git nao esta instalado!
    pause
    exit /b
)

echo [1/4] Verificando status...
git status

echo.
echo [2/4] Adicionando todas as mudancas...
git add .

echo.
echo [3/4] Fazendo commit...
git commit -m "Adiciona filtros mensais, relatorios, comparativos e corrige saldo inicial - %date%"

echo.
echo [4/4] Enviando para GitHub...
git push origin main

echo.
echo ========================================
echo  CONCLUIDO!
echo ========================================
echo.
echo Suas mudancas foram enviadas para:
echo https://github.com/developerfuturetech7-hub/sistema-gestao
echo.
echo O site sera atualizado em alguns minutos em:
echo https://developerfuturetech7-hub.github.io/sistema-gestao/
echo.
pause
