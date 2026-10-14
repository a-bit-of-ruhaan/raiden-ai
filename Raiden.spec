# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/main.py'],
    pathex=[],
    binaries=[],
    datas=[('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/index.html', '.'), ('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/css', 'css'), ('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/js', 'js'), ('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/vendor', 'vendor'), ('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/assets', 'assets'), ('C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/raiden_config.example.json', '.')],
    hiddenimports=['webview', 'webview.platforms.winforms', 'webview.platforms.edgechromium', 'ollama', 'raiden_core', 'requests', 'bs4'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Raiden',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['C:/Users/kmkdg/OneDrive/Desktop/Raiden AI/assets/raiden.ico'],
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Raiden',
)
