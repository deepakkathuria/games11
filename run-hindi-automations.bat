@echo off
echo Starting Hindi GSC Automations...



echo 2. Running Hindi Content Refresh...
curl -X POST http://localhost:5000/api/test-hindi-content-refresh

echo 3. Running Hindi Low CTR Fixes...
curl -X POST http://localhost:5000/api/test-hindi-low-ctr

echo 4. Running Hindi Ranking Watchdog...
curl -X POST http://localhost:5000/api/test-hindi-ranking-watchdog

echo 5. Running Hindi Content Query Match...
curl -X POST http://localhost:5000/api/test-hindi-content-query-match

echo All Hindi automations completed!
pause