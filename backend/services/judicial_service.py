"""
Judicial Token Service - Python integration with Solidity contract
Verifies court orders, manages access tokens, notifies users
"""

import json
import os
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from web3 import Web3, HTTPProvider
from eth_account import Account

# ABI (simplified - would be imported from compiled contract)
JUDICIAL_ABI = json.loads(''[{"inputs":[{"name":"orderId","type":"bytes32"}],"name":"verifyToken","outputs":[{"name":"","type":"bool"}],"type":"function"},{"inputs":[{"name":"orderId","type":"bytes32"},{"name":"userId","type":"string"}],"name":"getCourtOrder","outputs":[{"name":"judge","type":"address"},{"name":"userId","type":"string"},{"name":"issuedAt","type":"uint256"},{"name":"expiresAt","type":"uint256"},{"name":"reason","type":"string"},{"name":"isActive","type":"bool"},{"name":"wasAppealed","type":"bool"},{"name":"approvalCount","type":"uint256"}],"type":"function"}]')

class JudicialService:
    """
    Interface to JudicialToken smart contract.
    Handles court order verification and user notifications.
    """
    
    def __init__(self, contract_address: str = None, private_key: str = None):
        # Connect to Ethereum node (Infura/Alchemy for mainnet)
        infura_key = os.getenv("INFURA_API_KEY", "test")
        network = os.getenv("ETH_NETWORK", "sepolia")
        
        if network == "mainnet":
            rpc_url = f"https://mainnet.infura.io/v3/{infura_key}"
        else:
            rpc_url = f"https://sepolia.infura.io/v3/{infura_key}"
        
        self.w3 = Web3(HTTPProvider(rpc_url))
        
        # Contract
        addr = contract_address or os.getenv("JUDICIAL_CONTRACT_ADDRESS")
        if addr:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(addr),
                abi=JUDICIAL_ABI
            )
        else:
            self.contract = None
        
        # Account for transactions
        self.private_key = private_key or os.getenv("JUDICIAL_PRIVATE_KEY")
        self.account = Account.from_key(self.private_key) if self.private_key else None
    
    def verify_court_order(self, order_id: str) -> Dict[str, Any]:
        """
        Verify a court order token.
        Returns: {valid: bool, expires_at: datetime, reason: str}
        """
        if not self.contract:
            # Simulation mode (no blockchain)
            return {
                "valid": True,
                "expires_at": datetime.utcnow() + timedelta(days=7),
                "reason": "Simulated court order",
                "simulated": True
            }
        
        try:
            order_id_bytes = Web3.to_bytes(hexstr=order_id)
            
            # Verify token
            is_valid = self.contract.functions.verifyToken(order_id_bytes).call()
            
            if not is_valid:
                return {"valid": False, "reason": "Token invalid or expired"}
            
            # Get details
            details = self.contract.functions.getCourtOrder(order_id_bytes).call()
            
            return {
                "valid": True,
                "judge": details[0],
                "user_id": details[1],
                "issued_at": datetime.fromtimestamp(details[2]),
                "expires_at": datetime.fromtimestamp(details[3]),
                "reason": details[4],
                "is_active": details[5],
                "was_appealed": details[6],
                "approval_count": details[7]
            }
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def notify_user(self, user_id: str, order_id: str, method: str = "email") -> bool:
        """
        Notify user of court order (legal requirement).
        Uses email, in-app notification, and registered mail.
        """
        try:
            # In production: fetch user email from database
            user_email = f"{user_id}@example.com"  # Placeholder
            
            notification = {
                "user_id": user_id,
                "order_id": order_id,
                "timestamp": datetime.utcnow().isoformat(),
                "method": method,
                "message": (
                    f"Court Order {order_id[:16]}... has been issued for your data.\n"
                    f"You have the right to appeal within 48 hours.\n"
                    f"See: https://uju.ai/legal/court-order/{order_id}"
                )
            }
            
            # Send email (would use SendGrid/SES in production)
            print(f"📧 Notifying user {user_id} of court order {order_id[:16]}...")
            print(f"   Method: {method}")
            print(f"   To: {user_email}")
            
            # Log notification for audit
            self._log_notification(notification)
            
            return True
            
        except Exception as e:
            print(f"Failed to notify user: {e}")
            return False
    
    def _log_notification(self, notification: Dict):
        """Log notification to immutable audit trail."""
        log_path = "/secure/audit/user_notifications.jsonl"
        with open(log_path, "a") as f:
            f.write(json.dumps(notification) + "\n")
    
    def generate_access_token(self, user_id: str, order_id: str, duration_days: int = 7) -> Optional[str]:
        """
        Generate JWT-like token for court-ordered access.
        Token contains: order_id, user_id, expires_at, signature
        """
        try:
            import hashlib
            import hmac
            import base64
            
            # Create token
            expires_at = datetime.utcnow() + timedelta(days=duration_days)
            
            payload = f"{order_id}:{user_id}:{expires_at.isoformat()}"
            signature = hmac.new(
                key=os.getenv("JUDICIAL_SECRET", "test-secret").encode(),
                msg=payload.encode(),
                digestmod=hashlib.sha256
            ).digest()
            
            token = base64.urlsafe_b64encode(
                f"{payload}:{signature.hex()}".encode()
            ).decode()
            
            # Log token generation
            self._log_token_issuance({
                "token_hash": hashlib.sha256(token.encode()).hexdigest()[:16],
                "order_id": order_id,
                "user_id": user_id,
                "expires_at": expires_at.isoformat(),
                "issued_at": datetime.utcnow().isoformat()
            })
            
            return token
            
        except Exception as e:
            print(f"Failed to generate token: {e}")
            return None
    
    def _log_token_issuance(self, data: Dict):
        """Log token issuance to audit trail."""
        log_path = "/secure/audit/judicial_tokens.jsonl"
        with open(log_path, "a") as f:
            f.write(json.dumps(data) + "\n")
    
    def check_token_validity(self, token: str) -> Dict[str, Any]:
        """Check if a judicial access token is still valid."""
        try:
            import hmac
            import hashlib
            import base64
            
            # Decode token
            decoded = base64.urlsafe_b64decode(token).decode()
            payload, provided_sig = decoded.rsplit(":", 1)
            
            # Verify signature
            expected_sig = hmac.new(
                key=os.getenv("JUDICIAL_SECRET", "test-secret").encode(),
                msg=payload.encode(),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            if provided_sig != expected_sig:
                return {"valid": False, "reason": "Invalid signature"}
            
            # Parse payload
            order_id, user_id, expires_str = payload.split(":", 2)
            expires_at = datetime.fromisoformat(expires_str)
            
            if datetime.utcnow() > expires_at:
                return {"valid": False, "reason": "Token expired"}
            
            return {
                "valid": True,
                "order_id": order_id,
                "user_id": user_id,
                "expires_at": expires_str
            }
            
        except Exception as e:
            return {"valid": False, "reason": f"Token parse error: {e}"}


if __name__ == "__main__":
    print("🔍 Judicial Token Service - Test")
    print("=" * 50)
    
    service = JudicialService()
    
    # Test verification (simulation)
    test_order = "0x" + "a" * 64
    result = service.verify_court_order(test_order)
    
    print("\n📊 Verification Result:")
    for key, value in result.items():
        print(f"   {key}: {value}")
    
    # Test notification
    if result.get("valid"):
        service.notify_user("test_user_123", test_order)
        
        # Generate token
        token = service.generate_access_token("test_user_123", test_order)
        if token:
            print(f"\n✅ Access token generated: {token[:32]}...")
            
            # Verify token
            token_check = service.check_token_validity(token)
            print(f"\n✅ Token validity: {token_check}")
