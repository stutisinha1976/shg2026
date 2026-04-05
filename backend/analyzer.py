"""
analyzer.py — Thin wrapper around SHG APEX Platform for Flask web use.
"""
from shg_apex import SHGApexPlatform, sanitize_for_json

# Singleton platform instance
_platform = None


def get_platform(gemini_key=None, groq_key=None):
    """Get or create the singleton APEX platform instance."""
    global _platform
    if _platform is None:
        _platform = SHGApexPlatform(
            gemini_api_key=gemini_key,
            groq_api_key=groq_key,
        )
    return _platform


def analyze_ledger(image_path: str) -> dict:
    """Analyze a ledger image using the APEX platform. Returns sanitized dict."""
    platform = get_platform()
    results = platform.analyze(image_path)
    return sanitize_for_json(results)


def chat_finance(message: str, context: dict = None, language: str = "english") -> str:
    """Finance chatbot powered by APEX AI Router with knowledge base."""
    platform = get_platform()
    # If context is provided, temporarily set it as platform results
    if context:
        platform.results = context
    return platform.chat(message, language)
