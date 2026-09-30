---
name: Gemini model availability
description: Gemini API keys for new users may reject the requested legacy flash model even when the SDK and key are configured correctly.
---

Use the supported current flash preview model when a newly provisioned Gemini API key returns a provider 404 stating that the older flash model is unavailable. Keep the configured model explicit and document the provider response rather than adding a silent fallback.

**Why:** A real advisory generation request returned a provider-side 404 for the legacy model while the current flash preview model succeeded with the same key and structured response schema.

**How to apply:** When upgrading or debugging AgroBrain’s Gemini integration, verify model availability with one real request and treat provider model deprecations as configuration changes, not validation failures.