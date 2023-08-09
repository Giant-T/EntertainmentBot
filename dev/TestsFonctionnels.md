# Tests fonctionnels

### Tests de recherche
1. Utiliser le type film retourne une liste de films.
2. Utiliser le type jeu retourne une liste de jeux vidéos.
3. Rechercher "Oppenheimer" avec un type "Film" retourne bien une liste de film.
4. Rechercher "Minecraft" avec un type "Jeu" retourne bien une liste de jeux.
5. Cliquer sur un nombre correspondant à un article affiche une vue détaillée de cette article.

### Tests de pagination
1. Naviguer vers la droite est possible s'il reste des films dans la liste.
2. Naviguer vers la droite est impossible si c'est la fin de la liste.
3. Naviguer vers la gauche est possible s'il reste des films au début de la liste.
4. Naviguer vers la gauche est impossible si la liste est au début.
5. Cliquer sur un nombre est possible lorsque la liste n'est pas vide.
6. Cliquer sur un nombre est impossible si ce à quoi il réfère n'existe pas.
7. Il est impossible de naviguer ou de choisir un nombre si la liste est vide.
8. La liste est rafraichit lors du clique sur la flêche de droite ou de gauche.

### Tests de vue détaillée d'article
1. Fait une requête à la bonne api si on fournit seulement l'id d'un article.
2. Il est possible d'indiquer qu'on a visionné/joué à un film/jeu.
3. Il est possible de laisser une note à un film/jeu qu'on a regardé/joué.
4. Il est possible de laisser une critique à un film/jeu qu'on a regardé/joué.
5. Il est impossible de laisser une note à un film/jeu qu'on a pas regardé/joué.
6. Il est impossible de laisser une critique à un film/jeu qu'on a pas regardé/joué.
7. Il est possible d'ajouter une date de visionnement/jeu d'un film/jeu à un film/jeu non visionné/joué.
8. Il est impossible de planifier le visionnement d'un film/jeu déjà joué/consommé.

### Tests du profil
1. Si aucun utilisateur n'est spécifié, le profil de l'utilisateur qui a lancé la commande est utilisé.
2. Le profil affiche le nombre de films/jeux vus/joués par l'utilisateur.
3. Le profil affiche le nombre de films/jeux critiqués par l'utilisateur.
4. Il est possible de voir la liste des films/jeux vus/joués par l'utilisateur.
5. Il est possible de voir la liste des films/jeux critiqués par l'utilisateur.
6. Cliquer sur le nombre correspondant à une critique permet de voir une vue détaillée de la critique.

### Tests de vue détaillée de critique
1. Si la critique n'existe pas, un message indique que l'utilisateur n'as pas écrit de critique.
2. Si la note n'existe pas, un message indique que l'utilisateur n'as pas ajouter de note.

### Tests des recommandations
1. Le système propose uniquement des jeux si l'utilisateur spécifie le type "Jeu".
2. Le système propose uniquement des films si l'utilisateur spécifie le type "Film".
3. L'utilisateur se fait uniquement proposer des articles notés par l'autre utilisateur.