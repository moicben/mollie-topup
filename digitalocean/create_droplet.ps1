$apiToken = $env:DIGITALOCEAN_API_KEY
$dropletName = "ubuntu-eneba"
$region = "ams3" # Région (Pays-Bas)
$image = "ubuntu-24-10-x64" # OS à utiliser
$size = "s-1vcpu-1gb" # Taille de l'instance

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

$body = @{
  name   = $dropletName
  region = $region
  size   = $size
  image  = $image
} | ConvertTo-Json -Depth 2

Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets" -Method Post -Headers $headers -Body $body