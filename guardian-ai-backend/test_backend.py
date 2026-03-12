import requests
import json

API_URL = "http://localhost:8000"

test_tweets = [
    {"text": "I love the beautiful flowers in the park.", "username": "@nature_lover"},
    {"text": "You are actually so stupid and I hate you.", "username": "@hater_99"},
    {"text": "These people are disgusting and should be eliminated.", "username": "@extremist"},
    {"text": "That is so damn annoying, what the hell.", "username": "@frustrated_user"},
]

def test_analyze():
    print("Testing /analyze endpoint...")
    for tweet in test_tweets:
        response = requests.post(f"{API_URL}/analyze", json=tweet)
        if response.status_code == 200:
            data = response.json()
            print(f"User: {data['username']}")
            print(f"Original: {data['original']}")
            print(f"Label: {data['label']} ({data['emoji']})")
            print(f"Redacted: {data['redacted']}")
            print(f"Action: {data['action']}")
            print("-" * 30)
        else:
            print(f"Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    try:
        test_analyze()
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
