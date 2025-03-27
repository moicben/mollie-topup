$apiToken = $env:DIGITALOCEAN_API_KEY

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

# Récupérer la liste des snapshots
$response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/snapshots" -Method Get -Headers $headers

# Afficher les snapshots pour trouver l'ID de ton snapshot "eneba-flow-ready"
$response.snapshots | Select-Object id, name
