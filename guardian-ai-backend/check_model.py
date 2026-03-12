from transformers import AutoConfig
try:
    config = AutoConfig.from_pretrained("priyanshy/guardian-ai-twitter")
    print(f"ID2LABEL: {config.id2label}")
except Exception as e:
    print(f"Error: {e}")
