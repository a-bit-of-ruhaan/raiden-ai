"""
RAIDEN Desktop Shortcut Creator
Generates a direct 1-click Windows Desktop shortcut for RAIDEN AI with custom app icon.
Prioritizes the native compiled Raiden.exe if built, or pythonw.exe.
"""

import os
import sys
import subprocess

def create_shortcut():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    native_exe = os.path.join(base_dir, "dist", "Raiden", "Raiden.exe")
    single_exe = os.path.join(base_dir, "dist", "Raiden.exe")
    main_py = os.path.join(base_dir, "main.py")
    ico_path = os.path.join(base_dir, "assets", "raiden.ico")
    
    # Determine the best target executable
    if os.path.exists(native_exe):
        target_path = native_exe
        args = ""
        working_dir = os.path.dirname(native_exe)
        icon_loc = f"{native_exe},0"
        print("Using compiled Native Windows Executable: Raiden.exe")
    elif os.path.exists(single_exe):
        target_path = single_exe
        args = ""
        working_dir = base_dir
        icon_loc = f"{single_exe},0"
        print("Using compiled single-file Raiden.exe")
    else:
        pythonw_path = sys.executable.replace("python.exe", "pythonw.exe")
        if not os.path.exists(pythonw_path):
            pythonw_path = sys.executable
        target_path = pythonw_path
        args = f'"{main_py}"'
        working_dir = base_dir
        icon_loc = f"{ico_path},0"
        print(f"Using Python runtime: {pythonw_path}")

    # Find Desktop paths
    user_profile = os.environ.get("USERPROFILE", "")
    desktop_targets = []
    
    onedrive_desktop = os.path.join(user_profile, "OneDrive", "Desktop")
    if os.path.exists(onedrive_desktop):
        desktop_targets.append(onedrive_desktop)
        
    std_desktop = os.path.join(user_profile, "Desktop")
    if os.path.exists(std_desktop) and std_desktop not in desktop_targets:
        desktop_targets.append(std_desktop)

    created_any = False
    for dt in desktop_targets:
        shortcut_path = os.path.join(dt, "Raiden AI.lnk")
        
        ps_script = f"""
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('{shortcut_path}')
$Shortcut.TargetPath = '{target_path}'
$Shortcut.Arguments = '{args}'
$Shortcut.WorkingDirectory = '{working_dir}'
$Shortcut.IconLocation = '{icon_loc}'
$Shortcut.Description = 'RAIDEN AI — Local Desktop Intelligence'
$Shortcut.WindowStyle = 1
$Shortcut.Save()
"""
        try:
            subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script], check=True)
            print(f"SUCCESS: Created native desktop shortcut at:\n  {shortcut_path}")
            created_any = True
        except Exception as e:
            print(f"Could not create shortcut at {shortcut_path}: {e}")

    return created_any

if __name__ == "__main__":
    create_shortcut()
