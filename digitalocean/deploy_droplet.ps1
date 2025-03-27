$apiToken = $env:DIGITALOCEAN_API_KEY
$region = "ams3" # Change selon ta localisation
$size = "s-2vcpu-4gb" # Taille du Droplet
$disk = 10 # Taille du disque en GB
$image = "179465167" # ID du snapshot déjà créé

$privateKeyPath = "C:/Users/bendo/.ssh/id_rsa"

$headers = @{
  "Authorization" = "Bearer $apiToken"
  "Content-Type"  = "application/json"
}

# 1️⃣ Créer un clone du Droplet depuis le snapshot
$body = @{
  name   = "eneba-duplicate-" + (Get-Random)
  region = $region
  size   = $size
  image  = $image
  disk   = $disk
} | ConvertTo-Json -Depth 2

$droplet = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets" -Method Post -Headers $headers -Body $body
$dropletId = $droplet.droplet.id
Write-Output "✅ Nouveau Droplet créé avec ID: $dropletId"

# 2️⃣ Attendre que le Droplet soit actif
Start-Sleep -Seconds 70

# 3️⃣ Récupérer l'adresse IP du Droplet
$dropletInfo = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets/$dropletId" -Method Get -Headers $headers
$dropletIp = $dropletInfo.droplet.networks.v4[0].ip_address
Write-Output "✅ Adresse IP du Droplet: $dropletIp"

# 4️⃣ Désactiver l'expiration du mot de passe
$sshCommandDisablePasswordExpiry = "ssh -o StrictHostKeyChecking=no -i $privateKeyPath root@$dropletIp 'chage -I -1 -m 0 -M 99999 -E -1 root'"
Write-Output "✅ Désactivation de l'expiration du mot de passe..."
Invoke-Expression $sshCommandDisablePasswordExpiry

# 5️⃣ Exécuter Puppeteer sur le Droplet via SSH
$sshCommand = "ssh -o StrictHostKeyChecking=no -i $privateKeyPath root@$dropletIp 'node /root/eneba_checkout.mjs'"
Write-Output "✅ Exécution de Puppeteer sur le Droplet..."
Invoke-Expression $sshCommand

# 6️⃣ Supprimer le Droplet après l'achat
#Write-Output "🗑 Suppression du Droplet après l'achat..."
#Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets/$dropletId" -Method Delete -Headers $headers

Write-Output "✅ Processus terminé avec succès !"