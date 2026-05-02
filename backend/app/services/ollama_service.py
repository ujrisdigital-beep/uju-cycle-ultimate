import subprocess
import json
from typing import Dict, Any

class OllamaService:
    def __init__(self, host: str = "http://localhost:11434"):
        self.host = host
        
    def run(self, model: str, prompt: str) -> Dict[str, Any]:
        """Run Ollama model with prompt, return parsed JSON output"""
        try:
            # Use API instead of subprocess for cloud compatibility
            import requests
            response = requests.post(
                f"{self.host}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=120
            )
            response.raise_for_status()
            result = response.json()
            return json.loads(result.get("response", "{}"))
        except Exception as e:
            raise Exception(f"Ollama call failed: {str(e)}. Is Ollama running at {self.host}?")
    
    def pull_model(self, model: str) -> bool:
        """Pull Ollama model if not present"""
        try:
            import requests
            response = requests.post(
                f"{self.host}/api/pull",
                json={"model": model},
                timeout=300
            )
            return response.status_code == 200
        except:
            return False
