# Jisuke

![Node.js](https://img.shields.io/badge/Node.js-v25.5.0-yellow)
![WanaKana](https://img.shields.io/badge/WanaKana-5.3.1-red)
![Kuromoji.js](https://img.shields.io/badge/Kuromoji.js-0.1.2-blue)

Jisuke is a lightweight browser extension that adds [rōmaji](https://en.wikipedia.org/wiki/Romanization_of_Japanese) above Japanese text, intended for beginner learners of the Japanese language.

## Information
After installation, Jisuke will automatically add rōmaji on top of any Japanese text, so no activation is needed.

Jisuke only reads webpage text to generate rōmaji locally. No data is collected or sent externally.

**Note:** Some names or rare kanji may produce incorrect readings or may not display any rōmaji above.

## Setup
1. Download the repository as ZIP.

2. Extract the folder from ZIP.

3. Load the extension in a Chromium-based browser:
    - Open the extensions page:
        - Chrome: `chrome://extensions`
        - Edge: `edge://extensions`
    - Enable Developer Mode.
    - Click on `Load unpacked`.
    - Select the extracted folder.
    
4. Test by going to any site containing Japanese text.

## Contributions
Contributions, reporting issues and feature requests are welcome. Feel free to submit an issue or open a pull request.

## Credits
This project would not be possible without the following open-source projects:

- Kuromoji.js: https://github.com/takuyaa/kuromoji.js
    - Licensed under the Apache License 2.0.
    - Used components:
        - `dict/`
        - `kuromoji.js`

- WanaKana: https://github.com/WaniKani/WanaKana
    - Licensed under the MIT License.
    - Used component: `wanakana.min.js`

## Built With
- Node.js: https://nodejs.org
