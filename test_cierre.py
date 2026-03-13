import requests
import json

# Login
login_url = 'http://localhost:3001/api/v1/auth/login'
login_data = {'email': 'admin@test.com', 'password': '123456'}
response = requests.post(login_url, json=login_data)
result = response.json()
token = result.get('token')
user_id = result.get('user', {}).get('id')

print(f'Token: {token}')
print(f'User ID: {user_id}')

# Test cierre-caja endpoint
cierre_url = 'http://localhost:3001/api/v1/cierre-caja'
cierre_data = {
    'tipo_periodo': 'diario',
    'fecha_referencia': '2024-01-15',
    'id_usuario': user_id
}
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
response = requests.post(cierre_url, json=cierre_data, headers=headers)
print(f'Status Code: {response.status_code}')
print(f'Response: {response.text}')
