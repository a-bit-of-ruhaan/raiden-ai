"""
RAIDEN Native PC Application Builder
Packages RAIDEN AI into a standalone Windows executable (.exe) using PyInstaller.
"""

import os
import sys
import subprocess
import shutil

def build_app(onefile=False):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    main_script = os.path.join(base_dir, "main.py")
    ico_path = os.path.join(base_dir, "assets", "raiden.ico")

    # Verify assets exist
    if not os.path.exists(ico_path):
        print("Warning: assets/raiden.ico not found.")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconsole",
        "--name", "Raiden",
        "--add-data", f"{os.path.join(base_dir, 'index.html')};.",
        "--add-data", f"{os.path.join(base_dir, 'css')};css",
        "--add-data", f"{os.path.join(base_dir, 'js')};js",
        "--add-data", f"{os.path.join(base_dir, 'vendor')};vendor",
        "--add-data", f"{os.path.join(base_dir, 'assets')};assets",
        "--add-data", f"{os.path.join(base_dir, 'raiden_config.example.json')};.",
        "--hidden-import", "webview",
        "--hidden-import", "webview.platforms.winforms",
        "--hidden-import", "webview.platforms.edgechromium",
        "--hidden-import", "ollama",
        "--hidden-import", "raiden_core",
        "--hidden-import", "requests",
        "--hidden-import", "bs4",
        "--clean",
        "-y"
    ]

    if os.path.exists(ico_path):
        cmd.extend(["--icon", ico_path])

    if onefile:
        cmd.append("--onefile")
    else:
        cmd.append("--onedir")

    cmd.append(main_script)

    print("=" * 60)
    print("RAIDEN NATIVE APPLICATION BUILDER")
    print(f"Target: {'Single-file EXE' if onefile else 'Folder distribution (Recommended)'}")
    print("=" * 60)
    
    try:
        subprocess.run(cmd, check=True)
        out_dir = os.path.join(base_dir, "dist", "Raiden")
        print("\n" + "=" * 60)
        print("BUILD SUCCESSFUL!")
        if onefile:
            print(f"Standalone executable: {os.path.join(base_dir, 'dist', 'Raiden.exe')}")
        else:
            print(f"Native app directory: {out_dir}")
            print(f"Executable: {os.path.join(out_dir, 'Raiden.exe')}")
        print("=" * 60)
        return True
    except subprocess.CalledProcessError as err:
        print(f"\nBuild failed with exit code: {err.returncode}")
        return False

if __name__ == "__main__":
    onefile_mode = "--onefile" in sys.argv
    build_app(onefile=onefile_mode)
