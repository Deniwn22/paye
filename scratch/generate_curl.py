import hmac
import hashlib
import base64
import json
import time

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
            "transactionId": "paye_ref_123",
            "type": "PAYMENT",
            "time": "2026-07-01T20:00:00Z",
            "amount": "100.00",
            "responseCode": "00"
        }
    }
}

hashing_string = f"{payload['event_type']}:{payload['requestId']}:{payload['data']['merchant']['userId']}:{payload['data']['merchant']['walletId']}:{payload['data']['transaction']['transactionId']}:{payload['data']['transaction']['type']}:{payload['data']['transaction']['time']}:{payload['data']['transaction']['responseCode']}:{timestamp}"

h = hmac.new(secret.encode(), hashing_string.encode(), hashlib.sha256)
signature = base64.b64encode(h.digest()).decode()

payload_json = json.dumps(payload)

curl_cmd = f"""curl -X POST https://api.paye.africa/api/v1/webhooks/receive/live_nomba-webhook \\
  -H "Content-Type: application/json" \\
  -H "nomba-signature: {signature}" \\
  -H "nomba-timestamp: {timestamp}" \\
  -d '{payload_json}'"""

print(curl_cmd)
