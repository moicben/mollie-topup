param (
  [string]$dropletId = "478783602",
  [string]$snapshotName = "sample-puppeteer"
)

$apiToken = $env:DIGITALOCEAN_API_KEY

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

$body = @{
  type = "snapshot"
  name = $snapshotName
} | ConvertTo-Json -Depth 2

Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets/$dropletId/actions" -Method Post -Headers $headers -Body $body