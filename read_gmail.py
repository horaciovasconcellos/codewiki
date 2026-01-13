import os.path
import base64
from email.message import EmailMessage

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Escopo permitido (somente leitura)
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def autenticar():
    creds = None

    # Token salvo após primeiro login
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # Se não houver token válido, faz login OAuth
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Salva token para próximas execuções
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return creds

def listar_emails(max_results=10):
    creds = autenticar()
    service = build('gmail', 'v1', credentials=creds)

    results = service.users().messages().list(
        userId='me',
        maxResults=max_results
    ).execute()

    messages = results.get('messages', [])

    if not messages:
        print('Nenhum e-mail encontrado.')
        return

    for msg in messages:
        msg_data = service.users().messages().get(
            userId='me',
            id=msg['id'],
            format='metadata',
            metadataHeaders=['From', 'Subject', 'Date']
        ).execute()

        headers = msg_data['payload']['headers']
        email_info = {h['name']: h['value'] for h in headers}

        print('-' * 50)
        print(f"From: {email_info.get('From')}")
        print(f"Subject: {email_info.get('Subject')}")
        print(f"Date: {email_info.get('Date')}")

if __name__ == '__main__':
    listar_emails(5)

