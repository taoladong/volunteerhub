$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWluIiwibmFtZWlkIjoiMSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc4MzI3NDc5MywiZXhwIjoxNzgzMzAzNTkzLCJpYXQiOjE3ODMyNzQ3OTN9.HGfdglrmmvtynwqYeC1a8Af_f22JNBEdYXTNTKsDY9E"

Write-Host "Testing health..."
try {
    $res1 = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/health" -Headers @{ Authorization = "Bearer $token" }
    $res1 | ConvertTo-Json
} catch {
    Write-Host "Health Failed: $_"
}

Write-Host "Testing summary..."
try {
    $res2 = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/summary" -Headers @{ Authorization = "Bearer $token" }
    $res2 | ConvertTo-Json
} catch {
    Write-Host "Summary Failed: $_"
}
