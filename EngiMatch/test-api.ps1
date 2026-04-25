$body = @{
    sections = @(@{type='education';title='教育';content='Bachelor of Engineering, Mechanical Engineering, 2020-2024';id='s1'})
    major = 'mechanical'
    stage = 'have_resume'
    action = 'diagnose'
} | ConvertTo-Json -Compress

try {
    $resp = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai-resume/analyze' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 60
    Write-Host "SUCCESS: $($resp | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
