from flask import Flask
from models import db, User
import os

app = Flask(__name__)
# Utiliser un chemin absolu pour la base de données
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database', 'xbank.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'xbank-secret-key'

db.init_app(app)

with app.app_context():
    # Créer la base de données et les tables
    db_dir = os.path.dirname(db_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db.create_all()
    
    # Vérifier si un administrateur existe déjà
    admin = User.query.filter_by(permissions=0).first()
    if not admin:
        # Créer un administrateur par défaut
        admin = User(
            name='admin',
            surname='admin',
            password=User.hash_password('123456'),
            age=30,
            user_id=User.generate_user_id('admin', 'admin'),
            permissions=0,
            balance=1000,
            code=1234
        )
        db.session.add(admin)
        db.session.commit()
        print("Administrateur créé avec succès!")
    
    print("Base de données initialisée avec succès!")
