//constant
const VISIBLE_TYPES = "p, span, div, li, a, h1, h2, h3, h4, h5, h6, article, section"; //types to scan
const JP_RUBY_DONE = "data-jpruby-done"; //already done marker

//quick check if element has visible JP before scanning
function HasJP(element) {
  const t = element.textContent;
  JP_RE.lastIndex = 0;
  return !!t && JP_RE.test(t);
}

//observe visible elements and process them if inside viewport
function ObserveVisibles(tokenizer) {
  const io = new IntersectionObserver((entries) => { //init intersection observer
    for (const e of entries) {
      if (!e.isIntersecting) continue; //if not in viewport, skip

      const element = e.target; //else get the element
      io.unobserve(element); //stop watching

      if (element.hasAttribute(JP_RUBY_DONE)) continue; //if already done, skip
      if (!HasJP(element)) continue; //if no JP, skip

      element.setAttribute(JP_RUBY_DONE, "1"); //mark done
      enqueue(() => AddRubyToTextNodes(element, tokenizer));
    }
  }, { root: null, threshold: 0, rootMargin: "300px 0px" }); //treat slightly off-screen as visible

  //save elements under a root for observer
  function Watch(root) {
    const elements = root.querySelectorAll ? root.querySelectorAll(VISIBLE_TYPES) : [];
    for (const element of elements) {
      if (SKIP_TAGS.has(element.tagName)) continue; //skip unwanted element types
      if (element.hasAttribute(JP_RUBY_DONE)) continue; //if already done, skip
      if (!HasJP(element)) continue; //if no JP, skip
      io.observe(element);
    }
  }

  //register current page
  Watch(document.body);

  return { io, Watch };
}

// initial run
(async () => {
  
  //on page load
  const tokenizer = await initTokenizer(); //init tokenizer

  const visibles = ObserveVisibles(tokenizer); //get visibles

  //run if page changes
  const mo = new MutationObserver((mutations) => { //init mutation observer
    for (const mutation of mutations) { //changes
      for (const added of mutation.addedNodes) { //new nodes

        if (added.nodeType === Node.ELEMENT_NODE) { //check if node is element
          if (!SKIP_TAGS.has(added.tagName)) {
            visibles.Watch(added); //add to observe list
           }
        }
      }
    }
  });

  //observe changes
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();