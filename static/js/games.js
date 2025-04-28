// Fonctions pour le jeu de dés
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page du jeu de dés
    const diceGameContainer = document.querySelector('.dice-game-container');
    if (!diceGameContainer) return;

    const cursor = document.getElementById('cursor');
    const redZone = document.getElementById('red-zone');
    const greenZone = document.getElementById('green-zone');
    const percentage = document.getElementById('percentage');
    const winChance = document.getElementById('win-chance');
    const potentialReward = document.getElementById('potential-reward');
    const multiplier = document.getElementById('multiplier');
    const betButton = document.getElementById('bet-button');
    const betAmount = document.getElementById('bet-amount');
    const arrow = document.getElementById('arrow');
    const resultContainer = document.getElementById('result-container');
    const balanceDisplay = document.getElementById('balance');
    
    let isDragging = false;
    let cursorPosition = 50; // Pourcentage (0-100)
    
    // Initialiser la position du curseur
    updateCursorPosition(50);
    
    // Fonction pour mettre à jour la position du curseur
    function updateCursorPosition(pos) {
        cursorPosition = pos;
        const lineContainer = document.querySelector('.dice-line-container');
        const lineWidth = lineContainer.offsetWidth;
        
        // Mettre à jour la position du curseur
        cursor.style.left = `${pos}%`;
        
        // Mettre à jour les zones rouge et verte
        redZone.style.width = `${pos}%`;
        greenZone.style.width = `${100 - pos}%`;
        
        // Mettre à jour les pourcentages
        percentage.textContent = `${pos.toFixed(1)}%`;
        winChance.textContent = `${(100 - pos).toFixed(1)}%`;
        
        // Calculer la récompense potentielle
        let reward = 0;
        if (pos === 50) {
            reward = parseFloat(betAmount.value) * 0.95;
        } else if (pos !== 0) {
            reward = (parseFloat(betAmount.value) / ((100 - pos) / 95)) / 2;
        }
        
        potentialReward.textContent = `${reward.toFixed(2)} €`;
        multiplier.textContent = `${(reward / parseFloat(betAmount.value)).toFixed(2)}x`;
    }
    
    // Événements pour le curseur
    cursor.addEventListener('mousedown', function(e) {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const lineContainer = document.querySelector('.dice-line-container');
            const rect = lineContainer.getBoundingClientRect();
            let pos = ((e.clientX - rect.left) / rect.width) * 100;
            pos = Math.max(1, Math.min(99, pos)); // Limiter entre 1% et 99%
            updateCursorPosition(pos);
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Événement pour le bouton de pari
    betButton.addEventListener('click', function() {
        const bet = parseFloat(betAmount.value);
        const balance = parseFloat(balanceDisplay.textContent);
        
        if (isNaN(bet) || bet <= 0 || bet > balance) {
            alert('Montant de pari invalide!');
            return;
        }
        
        // Désactiver le bouton pendant le pari
        betButton.disabled = true;
        
        // Envoyer la requête au serveur
        fetch('/games/dice/bet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `bet_amount=${bet}&cursor_pos=${cursorPosition}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const result = data.result;
                
                // Afficher la flèche à la position aléatoire
                arrow.style.left = `${result.arrow_pos}%`;
                arrow.style.display = 'block';
                
                // Mettre à jour le solde
                balanceDisplay.textContent = result.new_balance.toFixed(2);
                
                // Afficher le résultat
                if (result.win) {
                    resultContainer.className = 'alert alert-success';
                    resultContainer.innerHTML = `<i class="fas fa-trophy"></i> <strong>Gagné!</strong> Vous avez gagné ${result.reward.toFixed(2)} €.`;
                } else {
                    resultContainer.className = 'alert alert-danger';
                    resultContainer.innerHTML = `<i class="fas fa-times-circle"></i> <strong>Perdu!</strong> Vous avez perdu ${bet.toFixed(2)} €.`;
                }
                resultContainer.style.display = 'block';
                
                // Réactiver le bouton après 2 secondes
                setTimeout(() => {
                    betButton.disabled = false;
                    arrow.style.display = 'none';
                }, 2000);
            } else {
                alert(data.message);
                betButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            betButton.disabled = false;
        });
    });
    
    // Mettre à jour la récompense potentielle lorsque le montant du pari change
    betAmount.addEventListener('input', function() {
        updateCursorPosition(cursorPosition);
    });
});

// Fonctions pour le jeu de mines
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page du jeu de mines
    const minesGrid = document.getElementById('mines-grid');
    if (!minesGrid) return;

    const startButton = document.getElementById('start-button');
    const cashoutButton = document.getElementById('cashout-button');
    const betAmount = document.getElementById('bet-amount');
    const mineCount = document.getElementById('mine-count');
    const revealedCount = document.getElementById('revealed-count');
    const currentReward = document.getElementById('current-reward');
    const multiplier = document.getElementById('multiplier');
    const resultContainer = document.getElementById('result-container');
    const balanceDisplay = document.getElementById('balance');
    
    let gameActive = false;
    let cells = [];
    
    // Générer la grille
    function generateGrid() {
        minesGrid.innerHTML = '';
        cells = [];
        
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mines-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => revealCell(i));
            minesGrid.appendChild(cell);
            cells.push(cell);
        }
    }
    
    // Initialiser le jeu
    function initGame() {
        const bet = parseFloat(betAmount.value);
        const mines = parseInt(mineCount.value);
        const balance = parseFloat(balanceDisplay.textContent);
        
        if (isNaN(bet) || bet <= 0 || bet > balance) {
            alert('Montant de pari invalide!');
            return;
        }
        
        if (isNaN(mines) || mines < 1 || mines > 24) {
            alert('Nombre de mines invalide!');
            return;
        }
        
        // Réinitialiser l'interface
        generateGrid();
        revealedCount.textContent = '0';
        currentReward.textContent = '0.00 €';
        multiplier.textContent = '1.00x';
        resultContainer.style.display = 'none';
        
        // Désactiver les contrôles
        startButton.disabled = true;
        betAmount.disabled = true;
        mineCount.disabled = true;
        cashoutButton.disabled = false;
        
        // Envoyer la requête au serveur
        fetch('/games/mines/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `bet_amount=${bet}&mine_count=${mines}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                gameActive = true;
            } else {
                alert(data.message);
                resetGame();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resetGame();
        });
    }
    
    // Révéler une cellule
    function revealCell(index) {
        if (!gameActive || cells[index].classList.contains('revealed-diamond') || cells[index].classList.contains('revealed-mine')) {
            return;
        }
        
        fetch('/games/mines/reveal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `position=${index}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const result = data.result;
                
                if (result.is_mine) {
                    // C'est une mine
                    cells[index].classList.add('revealed-mine');
                    cells[index].innerHTML = '<i class="fas fa-bomb"></i>';
                    
                    // Mettre à jour le solde
                    balanceDisplay.textContent = result.new_balance.toFixed(2);
                    
                    // Afficher le résultat
                    resultContainer.className = 'alert alert-danger';
                    resultContainer.innerHTML = `<i class="fas fa-bomb"></i> <strong>Boom!</strong> Vous avez perdu ${parseFloat(betAmount.value).toFixed(2)} €.`;
                    resultContainer.style.display = 'block';
                    
                    // Terminer le jeu
                    gameActive = false;
                    resetGame();
                } else {
                    // C'est un diamant
                    cells[index].classList.add('revealed-diamond');
                    cells[index].innerHTML = '<i class="fas fa-gem"></i>';
                    
                    // Mettre à jour les statistiques
                    revealedCount.textContent = result.revealed;
                    currentReward.textContent = `${result.reward.toFixed(2)} €`;
                    
                    // Calculer le multiplicateur
                    const mult = result.reward / parseFloat(betAmount.value);
                    multiplier.textContent = `${mult.toFixed(2)}x`;
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
    
    // Encaisser les gains
    function cashout() {
        if (!gameActive) {
            return;
        }
        
        fetch('/games/mines/cashout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mettre à jour le solde
                balanceDisplay.textContent = data.new_balance.toFixed(2);
                
                // Afficher le résultat
                resultContainer.className = 'alert alert-success';
                resultContainer.innerHTML = `<i class="fas fa-trophy"></i> <strong>Bravo!</strong> Vous avez encaissé ${currentReward.textContent}.`;
                resultContainer.style.display = 'block';
                
                // Terminer le jeu
                gameActive = false;
                resetGame();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
    
    // Réinitialiser le jeu
    function resetGame() {
        startButton.disabled = false;
        betAmount.disabled = false;
        mineCount.disabled = false;
        cashoutButton.disabled = true;
        gameActive = false;
    }
    
    // Événements
    startButton.addEventListener('click', initGame);
    cashoutButton.addEventListener('click', cashout);
    
    // Générer la grille initiale
    generateGrid();
});

// Fonctions pour le portefeuille et les graphiques
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page du portefeuille
    const portfolioChart = document.getElementById('portfolioChart');
    if (!portfolioChart) return;

    // Fonction pour générer des dates
    function generateDates(days) {
        const dates = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dates.push(date.toLocaleDateString('fr-FR'));
        }
        
        return dates;
    }
    
    // Fonction pour générer des données de solde
    function generateBalanceData(days, currentBalance) {
        const data = [];
        let balance = currentBalance * 0.7; // Commencer à 70% du solde actuel
        
        for (let i = 0; i < days; i++) {
            // Ajouter une variation aléatoire entre -3% et +5%
            const change = balance * (Math.random() * 0.08 - 0.03);
            balance += change;
            data.push(balance);
        }
        
        // S'assurer que le dernier point est le solde actuel
        data[days - 1] = currentBalance;
        
        return data;
    }
    
    // Fonction pour simuler la valeur d'un actif
    function simulateAssetValue(asset, shares) {
        // Simuler une valeur basée sur l'actif et le nombre de parts
        const baseValues = {
            'Bitcoin': 30000,
            'Ethereum': 2000,
            'Apple': 150,
            'Tesla': 200,
            'Microsoft': 300,
            'Google': 2500,
            'Alibaba': 100
        };
        
        const baseValue = baseValues[asset] || 100;
        return shares * baseValue;
    }
    
    // Fonction pour générer des données de prix d'actif
    function generateAssetPriceData(days, currentPrice, percentChange) {
        const data = [];
        const totalChange = currentPrice * (percentChange / 100);
        const startPrice = currentPrice - totalChange;
        const step = totalChange / (days - 1);
        
        for (let i = 0; i < days; i++) {
            // Ajouter une variation aléatoire pour rendre le graphique plus naturel
            const noise = currentPrice * (Math.random() * 0.04 - 0.02);
            const price = startPrice + (step * i) + noise;
            data.push(price);
        }
        
        // S'assurer que le dernier point est le prix actuel
        data[days - 1] = currentPrice;
        
        return data;
    }
    
    // Charger les données du portefeuille depuis l'API
    fetch('/portfolio/data')
        .then(response => response.json())
        .then(data => {
            // Mettre à jour les graphiques avec les données réelles
            updateBalanceChart(data.dates, data.balance_history);
            updatePortfolioChart(data.investments);
            updateAssetCards(data.investments, data.dates);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données du portefeuille:', error);
            // Utiliser des données simulées en cas d'erreur
            const currentBalance = parseFloat(document.getElementById('balance').textContent);
            updateBalanceChart(generateDates(30), generateBalanceData(30, currentBalance));
        });
    
    // Fonction pour mettre à jour le graphique d'évolution du solde
    function updateBalanceChart(dates, balanceData) {
        const balanceCtx = document.getElementById('balanceChart').getContext('2d');
        new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Solde (€)',
                    data: balanceData,
                    borderColor: 'rgba(30, 136, 229, 1)',
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }
    
    // Fonction pour mettre à jour le graphique de répartition du portefeuille
    function updatePortfolioChart(investments) {
        const currentBalance = parseFloat(document.getElementById('balance').textContent);
        const labels = ['Liquidités'];
        const data = [currentBalance];
        const colors = [
            'rgba(30, 136, 229, 0.8)',
            'rgba(0, 204, 102, 0.8)',
            'rgba(255, 171, 0, 0.8)',
            'rgba(220, 20, 60, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(255, 87, 34, 0.8)',
            'rgba(0, 150, 136, 0.8)'
        ];
        
        // Ajouter les investissements
        investments.forEach((investment, index) => {
            labels.push(investment.asset);
            data.push(investment.current_value);
        });
        
        const portfolioCtx = document.getElementById('portfolioChart').getContext('2d');
        new Chart(portfolioCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
        
        // Calculer et afficher la valeur totale des investissements
        let totalValue = investments.reduce((sum, investment) => sum + investment.current_value, 0);
        document.getElementById('investment-value').textContent = totalValue.toFixed(2) + ' €';
        
        // Calculer la performance globale
        const initialInvestment = totalValue * 0.9; // Simuler un investissement initial de 90% de la valeur actuelle
        const performance = ((totalValue - initialInvestment) / initialInvestment) * 100;
        const performanceElement = document.getElementById('overall-performance');
        performanceElement.textContent = performance.toFixed(2) + '%';
        performanceElement.style.color = performance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    }
    
    // Fonction pour mettre à jour les cartes d'actifs
    function updateAssetCards(investments, dates) {
        const assetsContainer = document.getElementById('assets-container');
        
        if (investments.length === 0) {
            assetsContainer.innerHTML = '<p>Vous n\'avez pas d\'investissements actifs.</p>';
            return;
        }
        
        assetsContainer.innerHTML = '';
        
        investments.forEach(investment => {
            const isPositive = investment.change_24h >= 0;
            
            const assetCard = document.createElement('div');
            assetCard.className = 'asset-card';
            assetCard.innerHTML = `
                <div class="asset-header">
                    <div class="asset-name">${investment.asset}</div>
                    <div class="asset-value">${investment.current_value.toFixed(2)} €</div>
                </div>
                <div class="row">
                    <div class="col-8">
                        <div class="chart-container" style="height: 150px;">
                            <canvas id="chart-${investment.asset}"></canvas>
                        </div>
                    </div>
                    <div class="col-4" style="display: flex; flex-direction: column; justify-content: center;">
                        <p>Parts: ${investment.shares.toFixed(4)}</p>
                        <p>Prix unitaire: ${investment.current_price.toFixed(2)} €</p>
                        <div class="asset-change ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${investment.change_24h.toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
            
            assetsContainer.appendChild(assetCard);
            
            // Créer un mini graphique pour chaque actif
            setTimeout(() => {
                const ctx = document.getElementById(`chart-${investment.asset}`).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: `Prix de ${investment.asset}`,
                            data: investment.price_history,
                            borderColor: isPositive ? 'rgba(0, 204, 102, 1)' : 'rgba(220, 20, 60, 1)',
                            backgroundColor: isPositive ? 'rgba(0, 204, 102, 0.1)' : 'rgba(220, 20, 60, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                display: false
                            },
                            y: {
                                display: false
                            }
                        }
                    }
                });
            }, 0);
        });
    }
});
