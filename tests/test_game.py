"""Run with python -m unittest discover -s tests (requires Playwright and Chromium).
GAME_URL optionally selects a running deployment. Each test uses a fresh profile.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class Gameplay(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        cls.addClassCleanup(server.server_close)
        cls.addClassCleanup(server.shutdown)
        cls.url = os.environ.get("GAME_URL", f"http://127.0.0.1:{server.server_port}/")
        driver = sync_playwright().start()
        cls.addClassCleanup(driver.stop)
        options = {}
        if os.environ.get("GAME_PROXY"):
            options["proxy"] = {"server": os.environ["GAME_PROXY"]}
        cls.browser = driver.chromium.launch(executable_path=os.environ.get("CHROMIUM_BIN") or shutil.which("chromium"), **options)
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 360, "height": 800},
                                          is_mobile=True, has_touch=True,
                                          ignore_https_errors=bool(os.environ.get("GAME_PROXY")))
        self.addCleanup(self.page.context.close)
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto(self.url)
        self.ev = self.page.evaluate

    def tearDown(self):
        self.assertEqual(self.errors, [])

    def click(self, name):
        self.page.get_by_role("button", name=name).first.click()

    def answer(self, value):
        self.page.locator("textarea").fill(value)

    def test_all_subjects(self):
        subjects = self.ev("DB")
        self.assertEqual(len({q["name"] for q in subjects}), 67)
        for index, q in enumerate(subjects):
            with self.subTest(subject=q["name"]):
                self.ev("i => startMystery(DB[i])", index)
                self.answer("duct tape")
                self.click("Submit")
                self.assertTrue(self.page.locator(".bad").is_visible())
                self.click("Hint")
                self.answer(q["name"])
                self.click("Submit")
                self.assertEqual(self.page.locator("h1").inner_text(), q["name"])
                self.assertIn("+105 XP", self.page.locator(".good").inner_text())
                for alias in q["aliases"]:
                    self.assertTrue(self.ev("([i,a]) => evaluate(a,DB[i]).ok", [index, alias]), alias)
        self.page.reload()
        self.assertEqual(self.ev("data.solved.length"), 67)

    def test_partial_and_progress(self):
        self.ev("""localStorage.setItem('skb_mech_v2', JSON.stringify({
          xp:321,solved:['Gimbal'],ideas:[{question:'Old design',idea:'Old note'}],wins:2,losses:1
        }))""")
        self.page.reload()
        for answer, points in [("gear and latch",70), ("Ratchet and pawl",70), ("ratchet",0)]:
            self.ev("startMystery(DB.find(q=>q.name==='Ratchet and pawl'))")
            self.answer(answer)
            self.click("Submit")
            self.assertIn(f"+{points} XP", self.page.locator(".good").inner_text())
        self.page.reload()
        self.assertEqual(self.ev("[data.xp,data.solved.length,data.wins,data.losses,data.ideas[0].idea]"),
                         [461,2,2,1,"Old note"])

    def test_battle(self):
        self.click("Battle Arena")
        # Offline battle must work whether or not Firebase is configured.
        self.click("Start offline battle")
        self.assertEqual(self.ev("new Set(game.pool.map(q=>q.name)).size"),5)
        self.ev("game.pool[0]=DB.find(q=>q.name==='Ratchet and pawl');battle()")
        total = 0
        for i in range(5):
            q = self.ev("game.pool[game.round].name")
            self.click("Hint")
            self.answer("gear and latch" if i==0 else q)
            self.click("Lock answer")
            self.click("Next player")
            self.assertEqual(self.page.locator(".score").first.inner_text(), str(total))
            self.assertEqual(self.page.locator("textarea").input_value(), "")
            self.answer("duct tape")
            self.click("Lock answer")
            self.click("See round result")
            total += 45 if i==0 else 115
            self.assertEqual(self.page.locator(".score").inner_text(), f"{total} — 0")
            self.click("Change to correct")
            self.assertEqual(self.page.locator(".score").inner_text(), f"{total} — 140")
            self.page.get_by_role("button",name="Change to incorrect").last.click()
            self.click("Next round" if i<4 else "Final result")
        self.assertIn("Player 1 wins",self.page.locator("h1").inner_text())
        self.click("Rematch")
        self.click("Workshop")
        self.page.reload()
        self.assertEqual(self.ev("data.wins"),1)

    def test_surprise_and_lab(self):
        # Force the former per-candidate random draw to miss every candidate.
        self.ev("window.originalRandom=Math.random; let n=0; Math.random=()=>n++===0 ? 0.3 : 0")
        self.click("Mechanism Lab")
        self.click("Surprise me")
        self.ev("Math.random=originalRandom")
        self.assertTrue(self.page.locator("#machine svg").is_visible())
        for name in self.ev("mechNames"):
            self.click("Change machine")
            self.click(name)
            self.click("Pause")
            self.click("Step")
            self.click("Reverse")
            self.click("Hint")
            self.page.locator(".part").first.dispatch_event("click")
            self.assertIn("1 parts inspected",self.page.locator("#seen").inner_text())
            self.answer("gear and latch" if name=="Ratchet and pawl" else name)
            self.click("Check my explanation")
            if name=="Ratchet and pawl":
                self.assertIn("+75 XP",self.page.locator(".good").inner_text())
            self.click("Next experiment")

    def test_navigation_layouts(self):
        for width,height in [(320,568),(360,800),(800,360),(1280,800)]:
            self.page.set_viewport_size({"width":width,"height":height})
            for mode in ["Mechanism Lab","Battle Arena","Mystery Vault","Daily Discovery","Inventor Lab","My Workshop"]:
                self.click(mode)
                if mode=="Daily Discovery":
                    self.click("Hint")
                    self.answer(self.ev("game.q.name"))
                    self.click("Submit")
                if mode=="Inventor Lab":
                    self.answer("A"*180)
                    self.click("Save invention")
                self.assertLessEqual(self.ev("document.documentElement.scrollWidth"),width,mode)
                self.click("Workshop")

    def test_functional_descriptions(self):
        examples = dict(line.split("\t") for line in
                        (ROOT/"tests/descriptions.tsv").read_text().splitlines())
        self.assertEqual(set(examples), set(self.ev("DB.map(q=>q.name)")))
        for name, answer in examples.items():
            with self.subTest(subject=name):
                result = self.ev("([name,a])=>evaluate(a,DB.find(q=>q.name===name))",
                                 [name,answer])
                self.assertTrue(result.get("partial"), result)

    def test_daily_replay(self):
        self.click("Daily Discovery")
        first = self.ev("game.q.name")
        self.answer(first)
        self.click("Submit")
        self.assertIn("+140 XP", self.page.locator(".good").inner_text())
        self.page.reload()
        self.click("Daily Discovery")
        self.assertEqual(first, self.ev("game.q.name"))
        self.answer(first)
        self.click("Submit")
        self.assertIn("+0 XP", self.page.locator(".good").inner_text())

    def test_screen_reader_status_survives_navigation_and_lab_feedback(self):
        status = self.page.locator("#screenReaderStatus")
        self.assertEqual(status.count(), 1)
        self.assertEqual(status.get_attribute("role"), "status")
        self.assertEqual(status.get_attribute("aria-live"), "polite")
        self.assertEqual(status.get_attribute("aria-atomic"), "true")
        self.assertEqual(status.inner_text(), self.page.locator("h1").inner_text())
        self.click("Mechanism Lab")
        self.assertEqual(status.count(), 1)
        self.assertEqual(status.inner_text(), self.page.locator("h1").inner_text())
        self.click("Ratchet and pawl")
        self.assertEqual(status.count(), 1)
        self.answer("duct tape")
        self.click("Check my explanation")
        feedback = self.page.locator("#feedback").inner_text().strip()
        self.assertTrue(feedback)
        self.assertIn(feedback, status.inner_text())
        self.click("Workshop")
        self.assertEqual(status.count(), 1)
        self.assertEqual(status.inner_text(), self.page.locator("h1").inner_text())
