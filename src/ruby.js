//char ranges
const JP_RE =/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+/gu;
const HAN_RE  = /\p{Script=Han}/u;
const KANA_RE = /[\p{Script=Hiragana}\p{Script=Katakana}ー]/u;

//skip tags
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE"]);

//check if need to skip text
function CheckSkip(node) {
  const p = node.parentElement;
  if (!p) return true;
  if (SKIP_TAGS.has(p.tagName)) return true;
  if (p.closest("ruby")) return true;
  if (p.closest("[contenteditable='true']")) return true;
  return false;
}

//quick check if text has JP
function HasJP(element) {
  const t = element.textContent;
  JP_RE.lastIndex = 0;
  return !!t && JP_RE.test(t);
}

//make text to ruby
function makeRuby(baseText, rtText) {
  const ruby = document.createElement("ruby");
  ruby.className = "jp-ruby";

  const rb = document.createElement("span");
  rb.className = "rb";
  rb.textContent = baseText;

  const rt = document.createElement("rt");
  rt.textContent = rtText;

  ruby.appendChild(rb);
  ruby.appendChild(rt);
  return ruby;
}

//build the ruby fragment
function buildRubyFrag(text, tokenizer) {
  const frag = document.createDocumentFragment(); //hidden html container

  //if kana only, use wanakana only
  if (!HAN_RE.test(text) && KANA_RE.test(text)) {
    frag.appendChild(makeRuby(text, wanakana.toRomaji(text)));
    return frag;
  }

  //if kanji, tokenize with kuromoji
  const tokens = tokenizer.tokenize(text); //tokenize

  for (const t of tokens) {
    const surface = t.surface_form;

    //if token is kana only, use wanakana
    if (!HAN_RE.test(surface) && KANA_RE.test(surface)) {
      frag.appendChild(makeRuby(surface, wanakana.toRomaji(surface)));
      continue;
    }

    //check if JP chunk has kana reading
    const readingKana = t.reading;
    const hasReading = !!readingKana;

    //if no reading, add plain text
    if (!hasReading) {
      frag.appendChild(document.createTextNode(surface));
      continue;
    }
    frag.appendChild(makeRuby(surface, wanakana.toRomaji(readingKana)));
  }

  return frag;
}

//add fragment to single text node
function AddRubyToTextNode(textNode, tokenizer) {
  const text = textNode.nodeValue; //get text

  if (!text) return; //if no text, return
  if (!JP_RE.test(text)) return; //if no japanese text, return

  //reset last search indexes
  JP_RE.lastIndex = 0;
  let last = 0;

  const frag = document.createDocumentFragment(); //hidden html container

  //for all JP matches
  for (const m of text.matchAll(JP_RE)) {
    //indexes
    const start = m.index;
    const JPchunk = m[0];
    const end = start + JPchunk.length;

    if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start))); //add text before JP chunk

    //add romaji above JP chunk
    const rubyFrag = buildRubyFrag(JPchunk, tokenizer);
    frag.appendChild(rubyFrag);

    last = end;
    }

  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last))); //add text after JP chunk

  textNode.replaceWith(frag); //replace node with the hidden html container
}

//add fragment to all text nodes of a root
async function AddRubyToTextNodes(root, tokenizer) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];

  let n;
  while ((n = walker.nextNode())) { //scan only text nodes
    if (!CheckSkip(n)) nodes.push(n); //if not skipped, add node to list
  }

  for (const node of nodes) await AddRubyToTextNode(node, tokenizer); //for node in list, add ruby to node
}