import logging
from typing import Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

NEON_BASE_URL = "https://console.neon.tech/api/v2"


class NeonClient:
    """Neon Database API client for branch management."""

    def __init__(self) -> None:
        self.api_key = settings.NEON_API_KEY
        self.project_id = settings.NEON_PROJECT_ID

    @property
    def _is_configured(self) -> bool:
        return bool(self.api_key and self.project_id)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_branch(
        self, branch_name: str, parent_branch: Optional[str] = None
    ) -> Optional[Dict]:
        if not self._is_configured:
            return None

        url = f"{NEON_BASE_URL}/projects/{self.project_id}/branches"
        payload = {
            "branch": {"name": branch_name, "parent_id": parent_branch},
            "endpoints": [{"type": "read_write"}],
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    url, headers=self._headers(), json=payload, timeout=30.0
                )
                resp.raise_for_status()
                logger.info("Neon branch created: %s", branch_name)
                return resp.json()
            except Exception as e:
                logger.error("Failed to create Neon branch: %s", e)
                return None

    async def get_connection_uri(
        self, branch_id: str, database: str = "neondb"
    ) -> Optional[str]:
        if not self._is_configured:
            return None

        url = f"{NEON_BASE_URL}/projects/{self.project_id}/connection_uri"
        params = {
            "branch_id": branch_id,
            "database_name": database,
            "role_name": "neondb_owner",
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    url, headers=self._headers(), params=params, timeout=30.0
                )
                resp.raise_for_status()
                uri = resp.json().get("uri", "")
                if uri and "sslmode=require" not in uri:
                    uri += "?sslmode=require"
                return uri
            except Exception as e:
                logger.error("Failed to get connection URI: %s", e)
                return None

    async def suspend_compute(self, branch_id: str) -> bool:
        if not self._is_configured:
            return False

        url = f"{NEON_BASE_URL}/projects/{self.project_id}/branches/{branch_id}"
        payload = {"branch": {"suspend_timeout_seconds": 300}}

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.patch(
                    url, headers=self._headers(), json=payload, timeout=30.0
                )
                resp.raise_for_status()
                logger.info("Compute suspended for branch: %s", branch_id)
                return True
            except Exception as e:
                logger.error("Failed to suspend compute: %s", e)
                return False


neon_client = NeonClient()
