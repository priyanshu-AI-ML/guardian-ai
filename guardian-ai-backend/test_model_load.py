from transformers import pipeline
import os

MODEL = "priyanshy/guardian-ai-twitter"
print(f"Testing model: {MODEL}")
try:
    classifier = pipeline("text-classification", model=MODEL, tokenizer=MODEL)
    result = classifier("This is a clean tweet.")
    print(f"Result: {result}")
    
    result = classifier("You are so damn stupid.")
    print(f"Result (vulgar): {result}")
except Exception as e:
    print(f"Error: {e}")
