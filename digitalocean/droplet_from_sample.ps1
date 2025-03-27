$apiToken = $env:DIGITALOCEAN_API_KEY
$region = "ams3" # Change selon ta localisation
$size = "s-2vcpu-4gb" # Taille du Droplet
$image = "179464596" # Nom du snapshot

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

$body = @{
  name   = "eneba-duplicate-" + (Get-Random)
  region = $region
  size   = $size
  image  = $image
} | ConvertTo-Json -Depth 2

Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets" -Method Post -Headers $headers -Body $body


