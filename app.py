from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Transaction, Loan
import os
import json
import random
import hashlib
from datetime import datetime, timedelta

app = Flask(__name__)
# Configuration
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database', 'xbank.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'xbank-secret-key'

# Initialisation des extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes pour l'authentification
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form.get('name')
        surname = request.form.get('surname')
        password = request.form.get('password')
        hashed_pwd = User.hash_password(password)
        
        user = User.query.filter_by(name=name, surname=surname, password=hashed_pwd).first()
        
        if user:
            login_user(user)
            flash('Connexion réussie!', 'success')
            if user.permissions == 0:
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('user_dashboard'))
        else:
            flash('Identifiants incorrects!', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        surname = request.form.get('surname')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        age = int(request.form.get('age'))
        
        if password != confirm_password:
            flash('Les mots de passe ne correspondent pas!', 'danger')
            return redirect(url_for('register'))
        
        if not (13 <= age <= 123):
            flash('Âge non valide! Vous devez avoir entre 13 et 123 ans.', 'danger')
            return redirect(url_for('register'))
        
        if len(password) != 6 or not password.isdigit():
            flash('Le mot de passe doit être composé de 6 chiffres!', 'danger')
            return redirect(url_for('register'))
        
        user_id = User.generate_user_id(name, surname)
        code = random.randint(1000, 9999)
        hashed_pwd = User.hash_password(password)
        permissions = 0 if name.lower() == 'admin' else 1
        
        new_user = User(
            name=name,
            surname=surname,
            password=hashed_pwd,
            age=age,
            user_id=user_id,
            permissions=permissions,
            code=code
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        flash(f'Compte créé avec succès! Votre ID: {user_id}', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté.', 'info')
    return redirect(url_for('index'))

# Routes pour le tableau de bord utilisateur
@app.route('/dashboard')
@login_required
def user_dashboard():
    return render_template('user_dashboard.html')

@app.route('/balance')
@login_required
def show_balance():
    return render_template('balance.html')

@app.route('/portfolio')
@login_required
def portfolio():
    return render_template('portfolio.html')

@app.route('/portfolio/data')
@login_required
def portfolio_data():
    # Générer des données historiques simulées pour le portefeuille
    days = 30
    start_date = datetime.today() - timedelta(days=days)
    dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days)]
    
    # Simuler l'évolution du solde
    balance_history = []
    current_balance = current_user.balance
    initial_balance = current_balance * 0.7  # Commencer à 70% du solde actuel
    
    for i in range(days):
        # Ajouter une variation aléatoire entre -3% et +5%
        if i == days - 1:
            balance = current_balance
        else:
            balance = initial_balance + (current_balance - initial_balance) * (i / (days - 1))
            # Ajouter du bruit
            balance += balance * (random.random() * 0.08 - 0.03)
        
        balance_history.append(round(balance, 2))
    
    # Simuler la valeur des investissements
    wallet = current_user.get_wallet()
    investment_data = []
    
    for asset, shares in wallet.items():
        # Simuler un prix de base pour chaque actif
        base_prices = {
            'Bitcoin': 30000,
            'Ethereum': 2000,
            'Apple': 150,
            'Tesla': 200,
            'Microsoft': 300,
            'Google': 2500,
            'Alibaba': 100
        }
        
        base_price = base_prices.get(asset, 100)
        current_price = base_price
        price_history = []
        
        # Générer l'historique des prix
        for i in range(days):
            if i == days - 1:
                price = current_price
            else:
                # Variation aléatoire entre -5% et +7%
                change = current_price * (random.random() * 0.12 - 0.05)
                price = base_price + (current_price - base_price) * (i / (days - 1)) + change
            
            price_history.append(round(price, 2))
        
        investment_data.append({
            'asset': asset,
            'shares': shares,
            'current_price': current_price,
            'current_value': round(shares * current_price, 2),
            'price_history': price_history,
            'change_24h': round((random.random() * 20 - 10), 2)  # Variation entre -10% et +10%
        })
    
    return jsonify({
        'dates': dates,
        'balance_history': balance_history,
        'investments': investment_data
    })

@app.route('/invest')
@login_required
def invest():
    assets = {
        "Bitcoin": "BTC-USD",
        "Ethereum": "ETH-USD",
        "Apple": "AAPL",
        "Tesla": "TSLA",
        "Microsoft": "MSFT",
        "Google": "GOOG",
        "Alibaba": "BABA",
    }
    return render_template('invest.html', assets=assets)

@app.route('/invest/data/<ticker>')
@login_required
def investment_data(ticker):
    # Simuler des données d'investissement avec des prix aléatoires
    num_days = 365
    start_date = datetime.today() - timedelta(days=num_days)
    dates = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(num_days)]
    prices = [random.uniform(100, 500) for _ in range(num_days)]
    
    data = [{"date": date, "price": price} for date, price in zip(dates, prices)]
    return jsonify(data)

@app.route('/invest/buy', methods=['POST'])
@login_required
def buy_investment():
    asset = request.form.get('asset')
    amount = float(request.form.get('amount'))
    
    if current_user.balance >= amount:
        # Simuler le nombre d'actions achetées
        price = random.uniform(100, 500)  # Prix simulé
        shares_bought = amount / price
        
        # Mettre à jour le portefeuille de l'utilisateur
        wallet = current_user.get_wallet()
        wallet[asset] = wallet.get(asset, 0) + shares_bought
        current_user.set_wallet(wallet)
        
        # Mettre à jour le solde et enregistrer la transaction
        current_user.balance -= amount
        current_user.log_transaction(f"Investi dans {asset}", -amount)
        
        db.session.commit()
        flash(f'Vous avez investi {amount} € dans {asset}.', 'success')
    else:
        flash('Fonds insuffisants!', 'danger')
    
    return redirect(url_for('invest'))

@app.route('/withdraw')
@login_required
def withdraw_investment():
    wallet = current_user.get_wallet()
    return render_template('withdraw.html', wallet=wallet)

@app.route('/withdraw/sell', methods=['POST'])
@login_required
def sell_investment():
    asset = request.form.get('asset')
    amount = float(request.form.get('amount'))
    
    wallet = current_user.get_wallet()
    if asset in wallet:
        shares = wallet[asset]
        price = random.uniform(100, 500)  # Prix simulé
        current_value = shares * price
        
        if 0 < amount <= current_value:
            shares_to_sell = amount / price
            wallet[asset] -= shares_to_sell
            
            if wallet[asset] <= 0:
                del wallet[asset]
            
            current_user.set_wallet(wallet)
            current_user.balance += amount
            current_user.log_transaction(f"Retiré de {asset}", amount)
            
            db.session.commit()
            flash(f'Vous avez retiré {amount} € de {asset}.', 'success')
        else:
            flash('Montant invalide!', 'danger')
    else:
        flash('Investissement non trouvé!', 'danger')
    
    return redirect(url_for('withdraw_investment'))

@app.route('/loan')
@login_required
def take_loan():
    return render_template('loan.html', loans=current_user.loans)

@app.route('/loan/apply', methods=['POST'])
@login_required
def apply_loan():
    amount = float(request.form.get('amount'))
    duration = int(request.form.get('duration'))  # En mois
    
    if amount <= 0 or duration <= 0:
        flash('Montant ou durée invalide!', 'danger')
        return redirect(url_for('take_loan'))
    
    interest_rate = 0.05  # 5% d'intérêt
    end_date = datetime.utcnow() + timedelta(days=duration * 30)
    
    loan = Loan(
        user_id=current_user.id,
        amount=amount,
        interest_rate=interest_rate,
        end_date=end_date
    )
    
    current_user.balance += amount
    current_user.log_transaction("Emprunt", amount)
    
    db.session.add(loan)
    db.session.commit()
    
    flash(f'Emprunt de {amount} € accordé pour {duration} mois.', 'success')
    return redirect(url_for('take_loan'))

@app.route('/loan/repay/<int:loan_id>', methods=['POST'])
@login_required
def repay_loan(loan_id):
    loan = Loan.query.get_or_404(loan_id)
    
    if loan.user_id != current_user.id:
        flash('Accès non autorisé!', 'danger')
        return redirect(url_for('take_loan'))
    
    if current_user.balance >= loan.amount:
        current_user.balance -= loan.amount
        current_user.log_transaction("Remboursement d'emprunt", -loan.amount)
        
        loan.is_paid = True
        db.session.commit()
        
        flash('Emprunt remboursé avec succès!', 'success')
    else:
        flash('Fonds insuffisants pour rembourser cet emprunt!', 'danger')
    
    return redirect(url_for('take_loan'))

@app.route('/transfer')
@login_required
def transfer_funds():
    return render_template('transfer.html')

@app.route('/transfer/send', methods=['POST'])
@login_required
def send_transfer():
    recipient_id = request.form.get('recipient_id')
    amount = float(request.form.get('amount'))
    
    if amount <= 0:
        flash('Montant invalide!', 'danger')
        return redirect(url_for('transfer_funds'))
    
    if current_user.balance < amount:
        flash('Fonds insuffisants!', 'danger')
        return redirect(url_for('transfer_funds'))
    
    recipient = User.query.filter_by(user_id=recipient_id).first()
    if not recipient:
        flash('Destinataire non trouvé!', 'danger')
        return redirect(url_for('transfer_funds'))
    
    current_user.balance -= amount
    current_user.log_transaction(f"Transfert à {recipient.name} {recipient.surname}", -amount)
    
    recipient.balance += amount
    recipient.log_transaction(f"Transfert de {current_user.name} {current_user.surname}", amount)
    
    db.session.commit()
    
    flash(f'Transfert de {amount} € effectué avec succès!', 'success')
    return redirect(url_for('transfer_funds'))

@app.route('/transactions')
@login_required
def view_transactions():
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.timestamp.desc()).all()
    return render_template('transactions.html', transactions=transactions)

# Routes pour les jeux
@app.route('/games')
@login_required
def games():
    return render_template('games.html')

@app.route('/games/dice')
@login_required
def dice_game():
    return render_template('dice.html', balance=current_user.balance)

@app.route('/games/dice/bet', methods=['POST'])
@login_required
def dice_bet():
    bet_amount = float(request.form.get('bet_amount'))
    cursor_pos = float(request.form.get('cursor_pos'))
    
    if bet_amount <= 0 or bet_amount > current_user.balance:
        return jsonify({'success': False, 'message': 'Montant de pari invalide!'})
    
    # Logique du jeu de dés
    arrow_pos = random.uniform(0, 100)  # Position aléatoire de la flèche
    chance = 100 - cursor_pos  # Chance de gagner
    
    result = {
        'arrow_pos': arrow_pos,
        'win': arrow_pos > cursor_pos
    }
    
    if result['win']:
        # Calculer la récompense
        if chance == 50:
            reward = bet_amount * 0.95
        else:
            reward = (bet_amount / (chance / 95)) / 2
        
        current_user.balance += reward
        current_user.log_transaction("Gain au jeu de dés", reward)
        result['reward'] = reward
    else:
        current_user.balance -= bet_amount
        current_user.log_transaction("Perte au jeu de dés", -bet_amount)
        result['reward'] = 0
    
    db.session.commit()
    result['new_balance'] = current_user.balance
    
    return jsonify({'success': True, 'result': result})

@app.route('/games/mines')
@login_required
def mines_game():
    return render_template('mines.html', balance=current_user.balance)

@app.route('/games/mines/init', methods=['POST'])
@login_required
def mines_init():
    mine_count = int(request.form.get('mine_count', 6))
    rows, cols = 5, 5
    
    # Générer les positions des mines
    mine_positions = random.sample(range(rows * cols), mine_count)
    
    # Créer la grille
    grid = []
    for i in range(rows * cols):
        grid.append({'is_mine': i in mine_positions, 'is_revealed': False})
    
    session['mines_grid'] = grid
    session['mines_bet'] = float(request.form.get('bet_amount', 0))
    session['mines_revealed'] = 0
    session['mines_reward'] = 0
    session['mines_active'] = True
    
    return jsonify({'success': True})

@app.route('/games/mines/reveal', methods=['POST'])
@login_required
def mines_reveal():
    if not session.get('mines_active', False):
        return jsonify({'success': False, 'message': 'Partie non active!'})
    
    position = int(request.form.get('position'))
    grid = session.get('mines_grid', [])
    
    if position < 0 or position >= len(grid):
        return jsonify({'success': False, 'message': 'Position invalide!'})
    
    if grid[position]['is_revealed']:
        return jsonify({'success': False, 'message': 'Case déjà révélée!'})
    
    grid[position]['is_revealed'] = True
    session['mines_grid'] = grid
    
    if grid[position]['is_mine']:
        # Perdu
        current_user.balance -= session['mines_bet']
        current_user.log_transaction("Perte au jeu de mines", -session['mines_bet'])
        db.session.commit()
        
        session['mines_active'] = False
        
        return jsonify({
            'success': True,
            'result': {
                'is_mine': True,
                'game_over': True,
                'new_balance': current_user.balance
            }
        })
    else:
        # Gagné cette case
        session['mines_revealed'] += 1
        
        # Calculer la récompense
        mine_count = sum(1 for cell in grid if cell['is_mine'])
        max_mines = len(grid) - 1
        mine_multiplier = 1 + (mine_count / max_mines)
        reward = round(session['mines_bet'] * (1.01 + mine_multiplier) ** (session['mines_revealed'] / 5), 2)
        
        session['mines_reward'] = reward
        
        return jsonify({
            'success': True,
            'result': {
                'is_mine': False,
                'revealed': session['mines_revealed'],
                'reward': reward
            }
        })

@app.route('/games/mines/cashout', methods=['POST'])
@login_required
def mines_cashout():
    if not session.get('mines_active', False):
        return jsonify({'success': False, 'message': 'Partie non active!'})
    
    reward = session.get('mines_reward', 0)
    
    current_user.balance += reward
    current_user.log_transaction("Gain au jeu de mines", reward)
    db.session.commit()
    
    session['mines_active'] = False
    
    return jsonify({
        'success': True,
        'new_balance': current_user.balance
    })

# Routes pour le tableau de bord administrateur
@app.route('/admin')
@login_required
def admin_dashboard():
    if current_user.permissions != 0:
        flash('Accès non autorisé!', 'danger')
        return redirect(url_for('user_dashboard'))
    
    users = User.query.filter(User.permissions != 0).all()
    return render_template('admin_dashboard.html', users=users)

@app.route('/admin/delete/<int:user_id>', methods=['POST'])
@login_required
def delete_account(user_id):
    if current_user.permissions != 0:
        flash('Accès non autorisé!', 'danger')
        return redirect(url_for('user_dashboard'))
    
    user = User.query.get_or_404(user_id)
    
    if user.permissions == 0:
        flash('Impossible de supprimer un administrateur!', 'danger')
    else:
        db.session.delete(user)
        db.session.commit()
        flash(f'L\'utilisateur {user.user_id} a été supprimé.', 'success')
    
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/modify/<int:user_id>', methods=['POST'])
@login_required
def modify_balance(user_id):
    if current_user.permissions != 0:
        flash('Accès non autorisé!', 'danger')
        return redirect(url_for('user_dashboard'))
    
    user = User.query.get_or_404(user_id)
    amount = float(request.form.get('amount'))
    
    user.balance = amount
    db.session.commit()
    
    flash(f'Le solde de l\'utilisateur {user.user_id} a été modifié.', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/transactions')
@login_required
def admin_transactions():
    if current_user.permissions != 0:
        flash('Accès non autorisé!', 'danger')
        return redirect(url_for('user_dashboard'))
    
    transactions = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    return render_template('admin_transactions.html', transactions=transactions)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
