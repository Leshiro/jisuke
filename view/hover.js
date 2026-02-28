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