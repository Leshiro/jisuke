//constant
const VISIBLE_TYPES = "p, span, div, li, a, h1, h2, h3, h4, h5, h6, article, section"; //types to watch
const JP_RUBY_DONE = "data-jpruby-done"; //done marker

//quick check if text has JP
function HasJP(element) {
  const t = element.textContent;
  JP_RE.lastIndex = 0;
  return !!t && JP_RE.test(t);
}

//observes candidate elements
function initVO(tokenizer) {

  //runs asynchronously when observed elements are visible
  const io = new IntersectionObserver(

    (entries) => {

      for (const e of entries) {
        if (!e.isIntersecting) continue; //ignore offscreen

        const element = e.target;
        io.unobserve(element); //stop watching this element

        //quick checks
        if (element.hasAttribute(JP_RUBY_DONE)) continue;
        if (!HasJP(element)) continue; 

        enqueue(() => {
          //final quick checks
          if (element.hasAttribute(JP_RUBY_DONE)) return;
          if (!HasJP(element)) return;

          AddRubyToTextNodes(element, tokenizer); //process
          element.setAttribute(JP_RUBY_DONE, "1"); //mark done
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
    if (root?.nodeType === Node.ELEMENT_NODE && root.matches?.(VISIBLE_TYPES)) {
      list.push(root);
    }

    //get children of root
    if (root?.querySelectorAll) {
      list.push(...root.querySelectorAll(VISIBLE_TYPES));
    }

    //let io observe each element
    for (const element of list) {
      //skips
      if (SKIP_TAGS.has(element.tagName)) continue;
      if (element.hasAttribute(JP_RUBY_DONE)) continue;
      if (!HasJP(element)) continue;

      io.observe(element);
    }
  }

  //scan the page once on init
  Watch(document.body);
  return { io, Watch };
}

//clears done mark
function ClearDone(startEl) {
  let el = startEl;

  while (el && el !== document.body && !el.hasAttribute(JP_RUBY_DONE)) {
    el = el.parentElement;
  }

  if (el && el.hasAttribute(JP_RUBY_DONE)) {
    el.removeAttribute(JP_RUBY_DONE);
    return el; //return the element we unlocked
  }

  return startEl; //fallback
}


//main bootstrap

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