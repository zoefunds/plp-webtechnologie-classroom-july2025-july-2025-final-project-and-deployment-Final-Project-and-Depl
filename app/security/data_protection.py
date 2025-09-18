from cryptography.fernet import Fernet
from app.config import settings
import bcrypt

class DataProtection:
    def __init__(self):
        self.cipher_suite = Fernet(settings.ENCRYPTION_KEY)

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive user data"""
        return self.cipher_suite.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive user data"""
        return self.cipher_suite.decrypt(encrypted_data.encode()).decode()

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash user password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify password against stored hash"""
        return bcrypt.checkpw(password.encode(), hashed_password.encode())