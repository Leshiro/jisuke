//on hover style
(function RubyHoverStyle() {
  const STYLE_ID = "jp-ruby-hover-style";
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    ruby.jp-ruby {
      ruby-position: over !important;
      -webkit-ruby-position: over !important;
    }

    ruby.jp-ruby .rb {
      display: ruby-base !important;
      padding: 1px 4px;
      border-radius: 0 !important;
      background: transparent !important;
    }

    ruby.jp-ruby rt {
      display: ruby-text !important;
      padding: 1px 4px;
      border-radius: 0 !important;
      background: transparent !important;
      position: relative;
      z-index: 1;
    }

    ruby.jp-ruby:hover .rb {
      background: #ff0000 !important;
      color: #ffffff !important;
    }

    ruby.jp-ruby:hover rt {
      background: #ff0000 !important;
      color: #ffffff !important;
    }
  `;

  document.head.appendChild(style);
})();

//on hover popup
(() => {
  const POP_ID = "rubyPop";
  if (document.getElementById(POP_ID)) return;

  const DELAY_MS = 300;

  document.head.insertAdjacentHTML("beforeend", `
  <style>
    #${POP_ID}{
      position:fixed;
      display:none; /* JS controls visibility */

      z-index:999999;
      background:#000;
      color:#fff;
      padding:10px 14px;
      border-radius:10px;
      box-shadow:0 8px 30px rgba(0,0,0,.35);
      pointer-events:none;

      font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
      text-align:center;
      white-space:nowrap;

      opacity:0;
      transition: opacity .12s ease;

      flex-direction:column;
      align-items:center;
      justify-content:center;
    }

    #rubyPop::after{
      content:"";
      position:absolute;
      left:50%;
      transform:translateX(-50%);
      top:100%;                 /* triangle under box */
      width:0;height:0;
      border-left:7px solid transparent;
      border-right:7px solid transparent;
      border-top:7px solid #000; /* same as popup bg */
    }

    #${POP_ID}.show{ opacity:1; }

    /* reading above */
    #${POP_ID} .rt{
      font-size:18px;
      font-weight:600;
      line-height:1.1;
      margin-bottom:4px;
    }

    /* kanji below */
    #${POP_ID} .rb{
      font-size:28px;
      font-weight:750;
      line-height:1.1;
    }
  </style>`);

  document.body.insertAdjacentHTML("beforeend", `
    <div id="${POP_ID}">
      <div class="rt"></div>
      <div class="rb"></div>
    </div>
  `);

  const pop = document.getElementById(POP_ID);
  const rtEl = pop.querySelector(".rt");
  const rbEl = pop.querySelector(".rb");

  let timer = null;
  let activeRuby = null;

  function placeSmart(ruby){
    const r = ruby.getBoundingClientRect();

    pop.style.display = "flex";
    pop.classList.remove("show");

    const w = pop.offsetWidth;
    const h = pop.offsetHeight;

    const GAP = 18;

    let left = r.left + r.width/2 - w/2;
    left = Math.max(8, Math.min(left, innerWidth - w - 8));

    //above only
    const top = r.top - h - GAP;

    //if not enough room, don't show popup
    if (top < 8){
      pop.style.display = "none";
      return false;
    }

    pop.style.left = left + "px";
    pop.style.top  = top + "px";

    requestAnimationFrame(()=>pop.classList.add("show"));

    return true;
  }

  //show if hovering
  document.addEventListener("mouseover", (e) => {
    const ruby = e.target.closest("ruby.jp-ruby");
    if (!ruby) return;

    activeRuby = ruby;
    clearTimeout(timer);

    timer = setTimeout(() => {
      if (activeRuby !== ruby) return;

      const rb = ruby.querySelector(".rb")?.textContent?.trim() ?? "";
      const rt = ruby.querySelector("rt")?.textContent?.trim() ?? "";

      rbEl.textContent = rb;
      rtEl.textContent = rt;
      rtEl.style.display = rt ? "block" : "none";

      if (!placeSmart(ruby)) return;
    }, DELAY_MS);
  });

  //hide when not hovering
  document.addEventListener("mouseout", (e) => {
    if (!e.target.closest("ruby.jp-ruby")) return;

    clearTimeout(timer);
    activeRuby = null;

    pop.classList.remove("show");
    pop.style.display = "none";
  });

    //hide on mouse click
  document.addEventListener("click", () => {
    clearTimeout(timer);
    activeRuby = null;

    pop.classList.remove("show");
    pop.style.display = "none";
  });
})();