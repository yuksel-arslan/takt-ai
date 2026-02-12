import httpx
import os
from typing import Optional, Dict, List
from config import settings
import logging

logger = logging.getLogger(__name__)

class NeonClient:
    """Neon API ile etkileşim için client"""
    
    def __init__(self):
        self.api_key = settings.NEON_API_KEY
        self.project_id = settings.NEON_PROJECT_ID
        self.base_url = "https://console.neon.tech/api/v2"
        
    async def create_branch(self, branch_name: str, parent_branch: Optional[str] = None) -> Optional[Dict]:
        """Yeni Neon branch'i oluştur"""
        if not self.api_key or not self.project_id:
            logger.warning("Neon API credentials not configured")
            return None
            
        url = f"{self.base_url}/projects/{self.project_id}/branches"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "branch": {
                "name": branch_name,
                "parent_id": parent_branch
            },
            "endpoints": [{"type": "read_write"}]
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                logger.info(f"✅ Neon branch created: {branch_name}")
                return data
            except Exception as e:
                logger.error(f"❌ Failed to create Neon branch: {e}")
                return None
    
    async def get_connection_uri(self, branch_id: str, database: str = "neondb") -> Optional[str]:
        """Branch için connection string al"""
        url = f"{self.base_url}/projects/{self.project_id}/connection_uri"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {
            "branch_id": branch_id,
            "database_name": database,
            "role_name": "neondb_owner"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params, timeout=30.0)
                response.raise_for_status()
                uri = response.json().get("uri")
                # SSL zorunlu
                if uri and "sslmode=require" not in uri:
                    uri += "?sslmode=require"
                return uri
            except Exception as e:
                logger.error(f"❌ Failed to get connection URI: {e}")
                return None
    
    async def suspend_compute(self, branch_id: str) -> bool:
        """Compute'i suspend et - maliyet optimizasyonu"""
        url = f"{self.base_url}/projects/{self.project_id}/branches/{branch_id}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "branch": {
                "suspend_timeout_seconds": 300  # 5 dakika
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.patch(url, headers=headers, json=payload)
                response.raise_for_status()
                logger.info(f"✅ Compute suspended for branch: {branch_id}")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to suspend compute: {e}")
                return False

# Singleton instance
neon_client = NeonClient()