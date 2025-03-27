$apiToken = $env:DIGITALOCEAN_API_KEY

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

# Récupérer la liste des Droplets
$response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets" -Method Get -Headers $headers

# Afficher les IDs et les noms des Droplets
$response.droplets | Select-Object id, name