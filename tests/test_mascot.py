"""
Automated validation suite for RAIDEN Cyber-Ronin Mascot integration.
Verifies all mascot assets, HTML structures, JS engines, stylesheets, and desktop configurations.
"""

import os
import unittest
from PIL import Image

class TestMascotIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def test_original_spritesheet_exists(self):
        spritesheet_path = os.path.join(self.base_dir, "raiden_spritesheet.png")
        self.assertTrue(os.path.exists(spritesheet_path), "raiden_spritesheet.png should exist in root")
        with Image.open(spritesheet_path) as img:
            self.assertEqual(img.size, (768, 1376))

    def test_unified_mascot_spritesheet_exists(self):
        unified_path = os.path.join(self.base_dir, "assets", "mascot", "mascot_spritesheet.png")
        self.assertTrue(os.path.exists(unified_path), "assets/mascot/mascot_spritesheet.png must exist")
        with Image.open(unified_path) as img:
            self.assertEqual(img.size, (1024, 512), "Unified spritesheet must be 1024x512 (4x2 of 256x256 frames)")
            self.assertEqual(img.mode, "RGBA", "Unified spritesheet must have an alpha channel")

    def test_mascot_pose_slices_exist(self):
        required_slices = ["hero.png", "thinking.png", "crouch.png", "stretch.png", "sit.png"]
        for slice_name in required_slices:
            slice_path = os.path.join(self.base_dir, "assets", "mascot", slice_name)
            self.assertTrue(os.path.exists(slice_path), f"Slice {slice_name} must exist")
            with Image.open(slice_path) as img:
                self.assertGreater(img.size[0], 50)
                self.assertGreater(img.size[1], 50)

    def test_js_mascot_engine_exists(self):
        mascot_js_path = os.path.join(self.base_dir, "js", "mascot.js")
        self.assertTrue(os.path.exists(mascot_js_path), "js/mascot.js must exist")
        with open(mascot_js_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("class MascotController", content)
        self.assertIn("IDLE", content)
        self.assertIn("THINKING", content)
        self.assertIn("ALERT", content)
        self.assertIn("STRETCH", content)
        self.assertIn("SITTING", content)
        self.assertIn("DRAGGED", content)
        self.assertIn("handleSystemEvent", content)
        self.assertIn("triggerDialogue", content)
        self.assertIn("playCyberTone", content)

    def test_index_html_integration(self):
        index_path = os.path.join(self.base_dir, "index.html")
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('id="raiden-mascot-container"', content)
        self.assertIn('id="raiden-dialogue-bubble"', content)
        self.assertIn('id="raidenCanvas"', content)
        self.assertIn('src="js/mascot.js"', content)

    def test_mascot_html_standalone_exists(self):
        mascot_html_path = os.path.join(self.base_dir, "mascot.html")
        self.assertTrue(os.path.exists(mascot_html_path), "mascot.html must exist for Electron desktop companion")
        with open(mascot_html_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('id="desktop-pet-container"', content)
        self.assertIn('id="dialogue-bubble"', content)
        self.assertIn('id="mascotCanvas"', content)
        self.assertIn('src="renderer.js"', content)

    def test_renderer_js_updated(self):
        renderer_path = os.path.join(self.base_dir, "renderer.js")
        with open(renderer_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("MascotController", content)
        self.assertIn("setMascotState", content)
        self.assertIn("handleSystemEvent", content)

    def test_main_js_loads_mascot_html(self):
        main_js_path = os.path.join(self.base_dir, "main.js")
        with open(main_js_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("mascot.html", content, "main.js should load mascot.html for the Electron window")

    def test_styles_css_contains_mascot_rules(self):
        css_path = os.path.join(self.base_dir, "css", "styles.css")
        with open(css_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("#raiden-mascot-container", content)
        self.assertIn("#raidenCanvas", content)
        self.assertIn("#raiden-dialogue-bubble", content)
        self.assertIn(".mascot-toolbar", content)

if __name__ == "__main__":
    unittest.main()
