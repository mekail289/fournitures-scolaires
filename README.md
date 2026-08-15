# Mon cartable — V1

Application mobile-first en français pour soustraire l’inventaire maison des listes scolaires, répartir les achats et utiliser une liste à cocher en magasin. Sans configuration, la démonstration est persistée sur l’appareil et fonctionne hors ligne après une première visite.

## Démarrage

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`. Vérification : `npm test` puis `npm run build`.

## Supabase

1. Créer un projet Supabase au Canada si cette région est disponible.
2. Exécuter `supabase/schema.sql` dans l’éditeur SQL.
3. Copier `.env.example` vers `.env.local` et remplir les deux valeurs publiques.
4. Activer la connexion par lien magique dans Authentication. Les politiques RLS du schéma isolent les données de chaque compte.

La V1 locale reste utilisable sans Supabase. Le schéma normalisé est prêt pour brancher la synchronisation multiappareil sans changer le modèle métier.

## Déploiement Vercel

1. Importer ce dépôt dans Vercel.
2. Conserver le preset Next.js et la commande de build `npm run build`.
3. Ajouter les deux variables Supabase aux environnements Production et Preview.
4. Déployer, ouvrir une première fois l’application, puis l’ajouter à l’écran d’accueil du téléphone.

## Données et prix

Le seed reprend les contraintes confirmées dans les listes fournies : cahiers ½ interlignés 23,2 × 18,1 cm en 2e, 4 cahiers lignés 0,7 cm et 24 HB en 4e, 8 grands cahiers lignés, 2 quadrillés 0,5 cm et 7 duo-tangs en 6e. Les autres lignes complètent une démonstration réaliste et doivent être validées au nouvel import des PDF.

Les trois marchands utilisent `ManualMerchantProvider`. Les prix affichés sont clairement des prix de démonstration à confirmer. Cette décision est volontaire : aucune API publique officielle et stable n’a été identifiée, les prix/stocks Jean Coutu varient par établissement, et les conditions de Bureau en Gros limitent la réutilisation automatisée du contenu. Une intégration future doit passer par une autorisation/API partenaire documentée.

## Hors ligne

Le service worker met en cache l’application et les écrans récemment ouverts. Les coches et modifications sont écrites immédiatement dans `localStorage`; elles survivent à une fermeture ou à une perte de réseau. La synchronisation Supabase différée est l’étape suivante pour plusieurs appareils.
