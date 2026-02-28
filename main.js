// --- CONSTANTS ---
const JP_RUBY_DONE = "data-jpruby-done"; //done marker

const VISIBLE_TYPES = "p, span, div, li, a, h1, h2, h3, h4, h5, h6, article, section"; //types to watch
const VISIBLE_TAGS = new Set(["P","SPAN","DIV","LI","A","H1","H2","H3","H4","H5","H6","ARTICLE","SECTION"]); //types as a set

const MAX_OBSERVED = 3000; //hard cap

// --- HELPERS ---

//track elements already observed to prevent duplicate observing
let observedCount = 0;
const observed = new WeakMap(); //if element, return true

//functions for handling the map
function isObserved(el) { return observed.get(el) === true; }
function markObserved(el) { observed.set(el, true); }
function clearObserved(el) { observed.delete(el); }

//create idle worker if supported
const IdleWorker = window.requestIdleCallback || ((cb) =>
  setTimeout(() => cb({ timeRemaining: () => 8 }), 1)
);

//quick check if text has JP
function HasJP(element) {
  const t = element.textContent;
  JP_RE.lastIndex = 0;
  return !!t && JP_RE.test(t);
}

//clear done mark
function ClearDone(startEl) {
  let el = startEl;
  while (el && el !== document.body && !el.hasAttribute(JP_RUBY_DONE)) {
    el = el.parentElement;
  }
  if (el && el.hasAttribute(JP_RUBY_DONE)) {
    el.removeAttribute(JP_RUBY_DONE);
    clearObserved(el);
    return el; //return the unlocked element
  }
  return startEl; //fallback
}

// --- MAIN FUNCTIONS ---

//observes candidate elements
function initVO(tokenizer) {

  //runs asynchronously when observed elements are visible
  const io = new IntersectionObserver(

    (entries) => {

      for (const e of entries) {
        if (!e.isIntersecting) continue; //ignore offscreen

        const el = e.target;
        io.unobserve(el); //stop watching this element
        clearObserved(el);

        //quick checks
        if (el.hasAttribute(JP_RUBY_DONE)) continue;
        if (!HasJP(el)) continue;

        enqueue(() => {
          //final quick checks
          if (el.hasAttribute(JP_RUBY_DONE)) return;
          if (!HasJP(el)) return;

          AddRubyToTextNodes(el, tokenizer); //process
          el.setAttribute(JP_RUBY_DONE, "1"); //mark done
        });
      }
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "300px 0px", //treat slightly off-screen as visible
    }
  );

  //function that gets the elements
  function Watch(root) {
    const list = []; //passed to Watch()

    //get root itself if it’s an element
    if (root?.nodeType === Node.ELEMENT_NODE) {
      const el = root;

      //skips
      if (!SKIP_TAGS.has(el.tagName) && !el.hasAttribute(JP_RUBY_DONE)) {

        //observe root if it matches visible types
        if (VISIBLE_TAGS.has(el.tagName) && !isObserved(el) && observedCount < MAX_OBSERVED) {
  
          //only observe if contains JP
          if (HasJP(el)) {
            markObserved(el);
            io.observe(el);
            observedCount++;
          }
        }
      }
    }

    //get children of root (only for small subtrees from mutations)
    if (root?.querySelectorAll) {
      list.push(...root.querySelectorAll(VISIBLE_TYPES));
    }

    //let io observe each element
    for (const el of list) {
      //skips
      if (observedCount >= MAX_OBSERVED) break;
      if (SKIP_TAGS.has(el.tagName)) continue;
      if (el.hasAttribute(JP_RUBY_DONE)) continue;
      if (isObserved(el)) continue;

      //only observe if contains JP
      if (!HasJP(el)) continue;

      markObserved(el);
      io.observe(el);
      observedCount++;
    }
  }

  //initial full page scan
  ProgressiveWatch(document.body, io);

  return { io, Watch };
}

//scan the page progressively
function ProgressiveWatch(root, io) {
  if (!root) return;

  //walk the page slowly instead of all at once on massive pages
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT; //skip forbidden tags
        if (!VISIBLE_TAGS.has(node.tagName)) return NodeFilter.FILTER_SKIP; //only accept necessary tag types

        //skip already done & already observed
        if (node.hasAttribute(JP_RUBY_DONE)) return NodeFilter.FILTER_REJECT;
        if (isObserved(node)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  //run in idle slices
  function work(deadline) {
    if (observedCount >= MAX_OBSERVED) return;

    while (deadline.timeRemaining() > 2) {
      const el = walker.nextNode();
      if (!el) return; //finished

      //skip if no JP
      if (!HasJP(el)) continue;

      markObserved(el);
      io.observe(el);
      observedCount++;

      if (observedCount >= MAX_OBSERVED) return;
    }
    IdleWorker(work); //continue
  }
  IdleWorker(work); //initial
}

// --- MAIN BOOTSTRAP ---

(async () => {
  const tokenizer = await initTokenizer(); //setup tokenizer
  const VO = initVO(tokenizer); //setup visible observer

  //watch DOM changes
  const MO = new MutationObserver((mutations) => {
    for (const m of mutations) {

      //1. if existing text node changes
      if (m.type === "characterData") {
        const textNode = m.target; //get the text node
        const parentEl = textNode?.parentElement; //get the parent

        //skips
        if (!parentEl) continue;
        if (SKIP_TAGS.has(parentEl.tagName)) continue;

        const unlocked = ClearDone(parentEl); //remove the done marker

        //if contains JP, watch
        if (HasJP(unlocked)) {
          VO.Watch(unlocked);
        }

        continue;
      }

      // 2. if new nodes are inserted
      if (m.type === "childList") {
        for (const added of m.addedNodes) {

          //if new node is text node
          if (added.nodeType === Node.TEXT_NODE) {
            const textNode = added;
            const parentEl = textNode.parentElement;
            if (!parentEl || SKIP_TAGS.has(parentEl.tagName)) continue;

            const unlocked = ClearDone(parentEl); //unlock done if marked done

            if (HasJP(unlocked))
              VO.Watch(unlocked);

            continue;
          }

          //3. if a new element is inserted, watch children
          if (added.nodeType === Node.ELEMENT_NODE) {
            const el = added;

            if (SKIP_TAGS.has(el.tagName)) continue;
            VO.Watch(el);

            continue;
          }

          //4. if a document fragment is inserted
          if (added.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            VO.Watch(added);
            continue;
          }
        }
      }
    }
  });

  //run mutation observer
  MO.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();