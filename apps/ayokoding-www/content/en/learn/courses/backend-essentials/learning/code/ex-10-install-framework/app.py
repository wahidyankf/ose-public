"""Example 10: Install Framework."""

import fastapi  # => the pinned, web-verified package installed in the venv
import uvicorn  # => the ASGI server every FastAPI example from here on uses


def report_versions() -> tuple[str, str]:  # => returns both installed versions
    """Return the installed, pinned FastAPI and uvicorn version strings."""
    # => fastapi.__version__ and uvicorn.__version__ are plain module attributes
    # => -- no network call, no subprocess; they read the installed package's
    # => own metadata, which pip wrote when "pip install fastapi==..." ran
    return fastapi.__version__, uvicorn.__version__
    # => a tuple of two strings, e.g. ("0.139.0", "0.51.0")


if __name__ == "__main__":  # => only runs when executed directly, not on import
    fastapi_version, uvicorn_version = report_versions()  # => unpacks the tuple
    print(f"fastapi=={fastapi_version}")  # => pinned CVE-clean version (co-22)
    # => matches the pinned version above exactly, or the run fails
    print(f"uvicorn=={uvicorn_version}")  # => confirms the SECOND pinned package
