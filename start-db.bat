@echo off
title SteadyAI Database Starter
echo ========================================================
echo          Starting SteadyAI PostgreSQL Database
echo ========================================================
echo.

docker start steadyai-postgres 2>nul
if errorlevel 1 (
    echo Creating and starting new PostgreSQL container steadyai-postgres on port 5435...
    docker run -d --name steadyai-postgres -p 5435:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=steadyai postgres:16-alpine
)

echo.
echo ========================================================
echo Database Status:
docker ps --filter "name=steadyai-postgres"
echo.
echo Connection: postgresql://postgres:postgres@localhost:5435/steadyai
echo ========================================================
echo.
pause
