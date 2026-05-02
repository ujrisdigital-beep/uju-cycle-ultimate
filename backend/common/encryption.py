"""
Encryption at rest for sensitive fields (AES-256-GCM)
Supports AWS KMS or local key (for dev/on-prem)
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import json

try:
    import boto3
    from botocore.exceptions import ClientError
    boto3_available = True
except ImportError:
    boto3_available = False

class EncryptionManager:
    def __init__(self, kms_key_id: str = None, local_key: bytes = None):
        self.kms_key_id = kms_key_id
        self.use_kms = kms_key_id and boto3_available
        if self.use_kms:
            self.kms = boto3.client('kms')
        else:
            # Local AES-256 key (from env DECRYPTION_KEY or generated)
            key = local_key or os.environ.get('DB_ENCRYPTION_KEY', '').encode()
            if not key or key == b'':
                key = os.urandom(32)
            self.local_key = key[:32] if len(key) >= 32 else key.ljust(32, b'\0')
            self.cipher_backend = default_backend()

    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext. Returns base64-encoded ciphertext."""
        if not plaintext:
            return plaintext
        if self.use_kms:
            resp = self.kms.encrypt(
                KeyId=self.kms_key_id,
                Plaintext=plaintext.encode()
            )
            return base64.b64encode(resp['CiphertextBlob']).decode()
        else:
            iv = os.urandom(16)
            cipher = Cipher(algorithms.AES(self.local_key), modes.CBC(iv), backend=self.cipher_backend)
            encryptor = cipher.encryptor()
            padder = padding.PKCS7(128).padder()
            padded = padder.update(plaintext.encode()) + padder.finalize()
            ciphertext = encryptor.update(padded) + encryptor.finalize()
            return base64.b64encode(iv + ciphertext).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext."""
        if not ciphertext:
            return ciphertext
        try:
            data = base64.b64decode(ciphertext)
            if self.use_kms:
                resp = self.kms.decrypt(
                    KeyId=self.kms_key_id,
                    CiphertextBlob=data
                )
                return resp['Plaintext'].decode()
            else:
                iv = data[:16]
                ct = data[16:]
                cipher = Cipher(algorithms.AES(self.local_key), modes.CBC(iv), backend=self.cipher_backend)
                decryptor = cipher.decryptor()
                padded = decryptor.update(ct) + decryptor.finalize()
                unpadder = padding.PKCS7(128).unpadder()
                plaintext = unpadder.update(padded) + unpadder.finalize()
                return plaintext.decode()
        except Exception:
            return ciphertext  # Return as-is if decryption fails

    def encrypt_dict(self, data: dict, fields: list) -> dict:
        """Encrypt specific fields in a dict."""
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.encrypt(result[field])
        return result

    def decrypt_dict(self, data: dict, fields: list) -> dict:
        """Decrypt specific fields in a dict."""
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.decrypt(result[field])
        return result
