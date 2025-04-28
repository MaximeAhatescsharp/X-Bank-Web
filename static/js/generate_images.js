// Créer des images simples pour les jeux
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
const ctx = canvas.getContext('2d');

// Fonction pour créer l'image du jeu de dés
function createDiceGameImage() {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la ligne
    ctx.fillStyle = '#43474a';
    ctx.fillRect(50, 150, 300, 20);
    
    // Zone rouge
    ctx.fillStyle = '#dc143c';
    ctx.fillRect(50, 150, 150, 20);
    
    // Zone verte
    ctx.fillStyle = '#00cc66';
    ctx.fillRect(200, 150, 150, 20);
    
    // Curseur
    ctx.fillStyle = '#808080';
    ctx.fillRect(195, 130, 10, 60);
    
    // Flèche
    ctx.fillStyle = '#1e88e5';
    ctx.fillRect(250, 120, 5, 80);
    
    // Texte
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Jeu de Dés', 200, 50);
    ctx.font = '16px Arial';
    ctx.fillText('Placez le curseur et pariez!', 200, 80);
    
    return canvas.toDataURL('image/png');
}

// Fonction pour créer l'image du jeu de mines
function createMinesGameImage() {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la grille
    const cellSize = 50;
    const gridSize = 5;
    const startX = (canvas.width - gridSize * cellSize) / 2;
    const startY = 100;
    
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            ctx.fillStyle = '#43474a';
            ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize - 5, cellSize - 5);
            
            // Ajouter quelques cellules révélées
            if ((i === 1 && j === 2) || (i === 3 && j === 1) || (i === 2 && j === 4)) {
                ctx.fillStyle = '#00cc66';
                ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize - 5, cellSize - 5);
            }
            
            // Ajouter une mine
            if (i === 4 && j === 3) {
                ctx.fillStyle = '#dc143c';
                ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize - 5, cellSize - 5);
            }
        }
    }
    
    // Texte
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Jeu de Mines', 200, 50);
    ctx.font = '16px Arial';
    ctx.fillText('Évitez les mines, trouvez les diamants!', 200, 80);
    
    return canvas.toDataURL('image/png');
}

// Exporter les images
const diceImage = createDiceGameImage();
const minesImage = createMinesGameImage();

console.log('Images générées:');
console.log('Jeu de Dés:', diceImage.substring(0, 50) + '...');
console.log('Jeu de Mines:', minesImage.substring(0, 50) + '...');

// Dans un navigateur, on pourrait télécharger les images ainsi:
// const link = document.createElement('a');
// link.download = 'dice_game.png';
// link.href = diceImage;
// link.click();
