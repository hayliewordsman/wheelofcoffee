# Wheel of Coffee

A word-puzzle board game for a host and up to four contestants, built to run
offline on an Android 4.2.2 tablet. It ships as a small WebView-wrapper APK and
also runs in any web browser.

![icon](www/icon.png)

## Install on the tablet

1. Copy `dist/WheelOfCoffee.apk` to the tablet (USB, SD card, or download it
   from GitHub in the tablet's browser).
2. On the tablet, open **Settings → Security** and turn on **Unknown sources**.
3. Open the APK in a file manager and tap **Install**.
4. Launch **Wheel of Coffee** from the app drawer.

The app needs no permissions and no internet connection. Fonts and graphics are
bundled inside it, and the game saves itself as you play, so if the app is closed
choose **Resume saved game** on the start screen.

## How to play

### Setup
Pick 1–4 contestants, type their names, and tap a colour (red, yellow, blue,
green) for each. Tapping a colour someone else has swaps the two.

### Regular rounds
- **Load Puzzle**: type the category (or tap a suggestion) and the puzzle.
  Lines wrap to the 4-row board automatically (rows 1 and 4 hold 12 letters,
  rows 2 and 3 hold 14); type `/` to force a line break. *Hide while typing*
  hides the answer from the audience, and *Center each line* changes the alignment.
  Punctuation (`' - & ? ! .`) shows on the board from the start.
- **Spin**: the wheel pops up over everything. Wedges are random point values
  from 100 to 950 (new values each round), plus two black **Bankrupt** and two
  white **Lose A Turn** wedges.
- After landing on a value, pick a consonant. Each matching square lights up
  **red** and then turns **white** with the letter. The contestant scores the
  wedge value **for every occurrence** (three R's at 700 = 2,100).
- **Vowels** cost 200 and can be bought any time the contestant isn't
  holding a spin.
- Each picked letter disappears from the letter board, whether it was in the
  puzzle or not.
- Play moves to the next contestant automatically on a missed letter, Bankrupt
  (round score goes to 0) or Lose A Turn. Otherwise the contestant keeps playing.
- **Solved**: reveals the puzzle with confetti and banks the current contestant's
  round score into their total. Then **Clear Board** for the next round.
- **Pass Turn** moves play on (e.g. after a wrong solve). Tapping a scoreboard
  makes that contestant active. **Menu → Edit Scores** fixes any mistakes.

### Bonus round
**Menu → Bonus Round** switches to a darker screen with no wheel and no
scoreboards.

1. Load the bonus puzzle and category.
2. Tap **R S T L N E** to reveal those letters.
3. The contestant picks 3 consonants and 1 vowel from the letter board (RSTLNE
   are not on it). The picks appear on the card next to the category. Tap a pick
   on the card to undo it.
4. Tap **Reveal Letters**.
5. Tap **Start Timer** (or the clock) for 10 seconds. **Solved** stops the clock
   and reveals the puzzle with confetti. If time runs out, the remaining letters
   are revealed quickly one by one, with no celebration.

**Menu → Back to Main Game** returns to the regular rounds.

## Play in a browser

Open `www/index.html` in any browser. It works the same way, without the
Android wrapper.

## Project layout

| Path | What it is |
| --- | --- |
| `www/index.html` | The whole game (HTML + CSS + ES5 JavaScript, no libraries) |
| `www/fonts/` | Bundled fonts: Arimo Bold (board letters), Oswald (scores and buttons), Lobster (logo). All are under the SIL Open Font License; license files are alongside them. |
| `android/` | WebView wrapper: manifest, `MainActivity.java`, icons, build script, signing key |
| `dist/WheelOfCoffee.apk` | The built, signed APK |
| `tools/make_icon.py` | Regenerates the launcher icons |
| `tools/playtest.js` | Automated play-through in headless Chromium (Playwright) |

The game is written for the Android 4.2 WebView (WebKit 534): no flexbox,
`calc()`, viewport units or ES2015 syntax. Everything is laid out in
JavaScript from the screen size, so it fits 800×480 tablets up to large
screens. The APK locks to landscape.

All graphics (board, wheel, confetti, icon) are drawn in code, so there are no
image files to replace. To use custom artwork, send the graphics and they can
be dropped in.

## Rebuilding the APK

Needs JDK 11+ and the Android SDK command-line tools:

```sh
sdkmanager "build-tools;35.0.0" "platforms;android-34"
ANDROID_HOME=/path/to/android-sdk android/build.sh
```

Use build-tools **35 or newer**, because the `d8` in build-tools 34 crashes on this
project. The script builds without Gradle (aapt2 → javac → d8 → zipalign →
apksigner) and writes `dist/WheelOfCoffee.apk`. It signs with v1 (required by
Android 4.2) plus v2/v3.

`android/wheelofcoffee.keystore` is the app's signing key. It is committed so
every rebuild can install over the previous version. Its password is in
`build.sh`, so it is not a secret; that is fine for a sideloaded hobby app,
but don't reuse it for anything else.
