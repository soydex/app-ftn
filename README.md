# Fortnite Pseudo Checker

Un outil client-only pour vérifier la compatibilité des pseudos Fortnite avec les règles Unicode, la longueur et d'autres critères de validation.

## Description

Cette application React permet de vérifier si un pseudo est compatible avec Fortnite. Elle analyse :
- La longueur (3-16 caractères visibles)
- Les caractères Unicode (support des émojis, accents, etc.)
- Les caractères problématiques (contrôle, surrogats, etc.)
- La normalisation NFC/NFKC
- Les espaces et caractères spéciaux

L'outil fonctionne entièrement côté client, sans envoyer de données.

## Fonctionnalités

- ✅ Validation en temps réel du pseudo
- ✅ Analyse caractère par caractère
- ✅ Suggestions de correction pour les modes conservateurs
- ✅ Historique des pseudos validés
- ✅ Support Unicode complet (grappes de graphèmes)
- ✅ Modes de validation : Ultra-sûr, Équilibré, Permissif
- ✅ Interface responsive avec Tailwind CSS

## Technologies utilisées

- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Outil de build rapide
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icônes
- **Intl.Segmenter** - Segmentation de graphèmes (si disponible)


## Utilisation

1. Ouvrir l'application dans le navigateur
2. Saisir un pseudo dans le champ
3. Sélectionner le mode de validation souhaité
4. Consulter les diagnostics et suggestions
5. Utiliser les boutons pour appliquer NFC/NFKC ou copier le pseudo

### Modes de validation

- **Ultra-sûr** : Lettres, chiffres, underscore uniquement
- **Équilibré** : Caractères étendus sûrs (recommandé)
- **Permissif** : Tolère plus de caractères, mais vérifie les problèmes


### Structure du projet

```
src/
├── App.tsx              # Composant principal
├── main.tsx             # Point d'entrée
├── index.css            # Styles globaux
├── vite-env.d.ts        # Types Vite
├── components/          # Composants réutilisables
│   ├── GithubStars.tsx
│   ├── Notifications.tsx
│   └── Simplenotification.tsx
├── hooks/               # Hooks personnalisés
│   ├── useNotification.ts
│   └── useSimpleNotification.ts
└── assets/              # Ressources statiques
    └── react.svg
```

## Validation des pseudos

### Règles principales

- **Longueur** : 3-16 caractères visibles (grappes de graphèmes)
- **Unicode** : Support complet, mais vérification des caractères problématiques
- **Normalisation** : NFC recommandée pour la compatibilité

### Caractères acceptés (mode équilibré)

- Lettres et chiffres Unicode
- Marques diacritiques
- Caractères ASCII étendus : ` _.-!@#$%^&*()+={}|\:;"'<>,?/~`-
- Émojis courants
- Symboles mathématiques et flèches basiques

### Caractères rejetés

- Caractères de contrôle/format
- Surrogats UTF-16 isolés
- Zones d'usage privé
- Points de code non assignés
- Non-caractères Unicode

## Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteur

Créé par soydex (EN/FR)

---

*Client-only — Aucune donnée envoyée*
