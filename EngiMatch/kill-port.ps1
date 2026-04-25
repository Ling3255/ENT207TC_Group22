Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    $pid = $_.OwningProcess
    if ($pid) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
}
echo "done"