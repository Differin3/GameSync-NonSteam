import os
import pickle
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import io
from base_provider import StorageProvider

logger = logging.getLogger(__name__)

# Scopes для Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Путь для хранения токенов
TOKEN_DIR = Path.home() / ".config" / "gamesync"
TOKEN_FILE = TOKEN_DIR / "token.pickle"

class GoogleDriveProvider(StorageProvider):
    def __init__(self, refresh_token: Optional[str] = None, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        self.service = None
        self.creds = None
        self.refresh_token = refresh_token
        self.client_id = client_id or os.getenv("GOOGLE_CLIENT_ID", "")
        self.client_secret = client_secret or os.getenv("GOOGLE_CLIENT_SECRET", "")
        self._load_or_create_credentials()
    
    def _load_or_create_credentials(self):
        """Загрузка или создание credentials"""
        TOKEN_DIR.mkdir(parents=True, exist_ok=True)
        
        # Пытаемся загрузить сохраненные credentials
        if TOKEN_FILE.exists():
            try:
                with open(TOKEN_FILE, 'rb') as token:
                    self.creds = pickle.load(token)
                logger.info("Loaded credentials from file")
            except Exception as e:
                logger.warning(f"Error loading credentials: {e}")
        
        # Если нет валидных credentials, используем refresh_token
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                    self._save_credentials()
                except Exception as e:
                    logger.error(f"Error refreshing credentials: {e}")
                    self.creds = None
            
            # Если есть refresh_token, создаем credentials
            if not self.creds and self.refresh_token:
                if not self.client_id or not self.client_secret:
                    raise Exception("Client ID и Client Secret обязательны для работы с refresh_token")
                try:
                    self.creds = Credentials(
                        token=None,
                        refresh_token=self.refresh_token,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=self.client_id,
                        client_secret=self.client_secret
                    )
                    # Пытаемся получить новый access token
                    self.creds.refresh(Request())
                    self._save_credentials()
                except Exception as e:
                    logger.error(f"Error creating credentials from refresh_token: {e}")
                    raise
    
    def _save_credentials(self):
        """Сохранение credentials"""
        try:
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(self.creds, token)
            logger.info("Saved credentials to file")
        except Exception as e:
            logger.error(f"Error saving credentials: {e}")
    
    def _get_service(self):
        """Получение сервиса Google Drive"""
        if not self.creds or not self.creds.valid:
            raise Exception("Invalid credentials")
        
        if not self.service:
            self.service = build('drive', 'v3', credentials=self.creds)
        
        return self.service
    
    def upload_file(self, file_path: str, folder_name: str = "GameSync") -> Optional[str]:
        """Загрузка файла на Google Drive"""
        try:
            service = self._get_service()
            
            # Находим или создаем папку
            folder_id = self._get_or_create_folder(folder_name)
            
            # Метаданные файла
            file_metadata = {
                'name': Path(file_path).name,
                'parents': [folder_id] if folder_id else []
            }
            
            # Загрузка файла
            media = MediaFileUpload(file_path, resumable=True)
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            logger.info(f"Uploaded file: {file.get('id')}")
            return file.get('id')
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return None
    
    def download_file(self, file_id: str, save_path: str) -> bool:
        """Скачивание файла с Google Drive"""
        try:
            service = self._get_service()
            
            # Получаем метаданные файла
            file_metadata = service.files().get(fileId=file_id).execute()
            
            # Скачиваем файл
            request = service.files().get_media(fileId=file_id)
            fh = io.FileIO(save_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
                logger.info(f"Download progress: {int(status.progress() * 100)}%")
            
            logger.info(f"Downloaded file: {save_path}")
            return True
        except Exception as e:
            logger.error(f"Error downloading file: {e}")
            return False
    
    def find_file(self, file_name: str, folder_name: str = "GameSync") -> Optional[str]:
        """Поиск файла по имени"""
        try:
            service = self._get_service()
            folder_id = self._get_or_create_folder(folder_name)
            
            query = f"name='{file_name}' and trashed=false"
            if folder_id:
                query += f" and '{folder_id}' in parents"
            
            results = service.files().list(q=query, fields="files(id, name)").execute()
            files = results.get('files', [])
            
            if files:
                return files[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error finding file: {e}")
            return None
    
    def _get_or_create_folder(self, folder_name: str) -> Optional[str]:
        """Получение или создание папки"""
        try:
            service = self._get_service()
            
            # Ищем существующую папку
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = service.files().list(q=query, fields="files(id, name)").execute()
            files = results.get('files', [])
            
            if files:
                return files[0]['id']
            
            # Создаем новую папку
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=file_metadata, fields='id').execute()
            return folder.get('id')
        except Exception as e:
            logger.error(f"Error getting/creating folder: {e}")
            return None
    
    def get_file_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Получение информации о файле"""
        try:
            service = self._get_service()
            file_metadata = service.files().get(
                fileId=file_id,
                fields='id, name, size, modifiedTime, createdTime'
            ).execute()
            
            return {
                'id': file_metadata.get('id'),
                'name': file_metadata.get('name'),
                'size': int(file_metadata.get('size', 0)),
                'modifiedTime': file_metadata.get('modifiedTime'),
                'createdTime': file_metadata.get('createdTime')
            }
        except Exception as e:
            logger.error(f"Error getting file info: {e}")
            return None
    
    def list_files(self, folder_name: str = "GameSync") -> list:
        """Список файлов в папке"""
        try:
            service = self._get_service()
            folder_id = self._get_or_create_folder(folder_name)
            
            if not folder_id:
                return []
            
            query = f"'{folder_id}' in parents and trashed=false"
            results = service.files().list(
                q=query,
                fields="files(id, name, size, modifiedTime, createdTime)",
                orderBy="modifiedTime desc"
            ).execute()
            
            return results.get('files', [])
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def test_connection(self) -> Dict[str, Any]:
        """Тест подключения к Google Drive"""
        try:
            service = self._get_service()
            # Пытаемся получить информацию о пользователе
            about = service.about().get(fields='user').execute()
            user = about.get('user', {})
            return {
                "success": True,
                "email": user.get('emailAddress', 'Unknown'),
                "message": "Подключение успешно"
            }
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Ошибка подключения"
            }
