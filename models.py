from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import hashlib
import random
import json

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(128), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.String(20), unique=True, nullable=False)
    permissions = db.Column(db.Integer, default=1)  # 1 for user, 0 for admin
    balance = db.Column(db.Float, default=0)
    wallet = db.Column(db.Text, default='{}')  # JSON string
    trust = db.Column(db.Integer, default=100)
    can_delete = db.Column(db.Boolean, default=True)
    code = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    loans = db.relationship('Loan', backref='user', lazy=True)
    
    def get_id(self):
        return str(self.id)
    
    def check_delete(self):
        return self.balance == 0 and self.get_wallet() == {}
    
    def get_wallet(self):
        return json.loads(self.wallet)
    
    def set_wallet(self, wallet_dict):
        self.wallet = json.dumps(wallet_dict)
    
    def log_transaction(self, description, amount):
        transaction = Transaction(user_id=self.id, description=description, amount=amount)
        db.session.add(transaction)
        db.session.commit()
    
    @staticmethod
    def generate_user_id(name, surname):
        return name[0] + str(random.randint(1000, 9999)) + surname[-1]
    
    @staticmethod
    def hash_password(password):
        return hashlib.md5(password.encode()).hexdigest()


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Loan(db.Model):
    __tablename__ = 'loans'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False)
    is_paid = db.Column(db.Boolean, default=False)
