#!/usr/bin/env python3
"""Local static server that mirrors the production locale route shape.

Cloudflare serves locale-prefixed public URLs from the corresponding base English asset
and then the site's localization runtime renders the selected language. A plain
`python -m http.server` cannot resolve deep routes such as /vi/resources/events/...,
so browser QA would otherwise test a different URL model from production.
"""

from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

LOCALES = {"vi", "zh-cn", "th", "id", "ms", "ar", "en"}


class LocalizedHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        parsed = urlsplit(path)
        clean = unquote(parsed.path)
        parts = [p for p in clean.split("/") if p]

        # Match the edge route: /vi/foo/ serves the same source asset as /foo/ while
        # keeping /vi/foo/ in the browser address bar for language selection/canonicals.
        if parts and parts[0].lower() in LOCALES:
            parts = parts[1:]
            clean = "/" + "/".join(parts)
            if parsed.path.endswith("/") and not clean.endswith("/"):
                clean += "/"
            if not parts:
                clean = "/"

        # SimpleHTTPRequestHandler already handles directory index files and traversal
        # protection. Give it only the rewritten path, without the query string.
        return super().translate_path(clean)

    def log_message(self, fmt: str, *args) -> None:
        # Keep CI logs readable unless there is an actual exception.
        pass


def main() -> None:
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("127.0.0.1", port), LocalizedHandler)
    print(f"Localized Wistudi preview running on http://127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
