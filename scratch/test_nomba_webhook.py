import hmac
import hashlib
import base64
import json
import time
import requests

secret = "NombaHackathon2026"
timestamp = str(int(time.time()))

payload = {
    "event_type": "transaction.success",
    "requestId": "req_123",
    "data": {
        "merchant": {
            "userId": "m_123",
            "walletId": "w_123"
        },
        "transaction": {
            "transactionId": "ref_123",
            "type": "PAYMENT",
            "time": "2026-07-01T20:00:00Z",
            "amount": 100.00,
            "responseCode": "00"
        }
    }
}

hashing_string = f"{payload['event_type']}:{payload['requestId']}:{payload['data']['merchant']['userId']}:{payload['data']['merchant']['walletId']}:{payload['data']['transaction']['transactionId']}:{payload['data']['transaction']['type']}:{payload['data']['transaction']['time']}:{payload['data']['transaction']['responseCode']}:{timestamp}"

h = hmac.new(secret.encode(), hashing_string.encode(), hashlib.sha256)
signature = base64.b64encode(h.digest()).decode()

headers = {
    "Content-Type": "application/json",
    "nomba-signature": signature,
    "nomba-timestamp": timestamp
}

url = "http://localhost:8080/api/v1/webhooks/receive/live_nomba-webhook"

print(f"Sending to {url}")
print(f"Signature: {signature}")
print(f"Timestamp: {timestamp}")

try:
    resp = requests.post(url, json=payload, headers=headers)
    print("Status:", resp.status_code)
    print("Body:", resp.text)
except Exception as e:
    print("Request failed:", e)

