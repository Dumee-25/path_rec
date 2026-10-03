/* @ds-bundle: {"format":4,"namespace":"NsbmPathway","components":[{"name":"Header"},{"name":"ThemeToggle"},{"name":"Button"},{"name":"QuestionProgress"},{"name":"AnswerOption"},{"name":"MatchScore"},{"name":"ResultCard"},{"name":"DegreeCard"},{"name":"MediaFrame"},{"name":"Notice"},{"name":"LoadingState"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(" ");
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }

  function Button(props) {
    var variant = props.variant || "primary";
    var rest = omit(props, ["variant", "fullWidth", "className", "children", "type"]);
    rest.type = props.type || "button";
    rest.className = cx("np-btn", "np-btn-" + variant, props.fullWidth && "np-btn-full", props.className);
    return h("button", rest, props.children);
  }

  var THEMES = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ];

  function resolveTheme(choice) {
    if (choice === "light" || choice === "dark") return choice;
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "dark" : "light";
  }

  function applyTheme(choice, options) {
    var c = choice || "system";
    try { localStorage.setItem("theme", c); } catch (e) {}
    var root = (options && options.root) || document.documentElement;
    root.setAttribute("data-theme", resolveTheme(c));
    return c;
  }

  function readTheme() {
    try { return localStorage.getItem("theme") || "system"; } catch (e) { return "system"; }
  }

  function ThemeToggle(props) {
    var value = props.value || "system";
    function onKey(e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var i = 0;
      for (var j = 0; j < THEMES.length; j++) if (THEMES[j].value === value) i = j;
      var next = THEMES[(i + (e.key === "ArrowRight" ? 1 : THEMES.length - 1)) % THEMES.length].value;
      if (props.onChange) props.onChange(next);
      var btn = e.currentTarget.querySelector('[data-value="' + next + '"]');
      if (btn) btn.focus();
    }
    return h(
      "div",
      { className: "np-theme", role: "radiogroup", "aria-label": props.label || "Theme", onKeyDown: onKey },
      THEMES.map(function (t) {
        var on = t.value === value;
        return h(
          "button",
          {
            key: t.value,
            type: "button",
            role: "radio",
            "aria-checked": on ? "true" : "false",
            tabIndex: on ? 0 : -1,
            "data-value": t.value,
            onClick: function () { if (props.onChange) props.onChange(t.value); }
          },
          t.label
        );
      })
    );
  }

  function Header(props) {
    var title = props.title === undefined ? "Faculty of Computing" : props.title;
    var links = props.links || [];
    var logo = props.logo || h("span", { className: "np-logo-text" }, "NSBM Green University");
    return h(
      "header",
      { className: cx("np-header", props.className) },
      h(
        "div",
        { className: "np-header-inner" },
        h("a", { className: "np-logo", href: props.homeHref || "/", "aria-label": "NSBM Green University, home" }, logo),
        title ? h("span", { className: "np-header-title" }, title) : null,
        links.length
          ? h("nav", { className: "np-header-links", "aria-label": "Main" }, links.map(function (l) {
              return h("a", { key: l.href, href: l.href }, l.label);
            }))
          : null,
        h("div", { className: "np-header-end" },
          props.end !== undefined ? props.end : h(ThemeToggle, { value: props.theme, onChange: props.onThemeChange }))
      )
    );
  }

  function Bar(props) {
    var pct = Math.max(0, Math.min(100, props.percent));
    return h("div", { className: "np-track", "aria-hidden": "true" },
      h("div", { className: cx("np-fill", props.tone === "secondary" && "np-fill-blue"), style: { width: pct + "%" } }));
  }

  function QuestionProgress(props) {
    var current = props.current, total = props.total;
    var text = "Question " + current + " of " + total;
    return h(
      "div",
      { className: cx("np-progress", props.className), role: "progressbar", "aria-valuemin": 0, "aria-valuemax": total, "aria-valuenow": current, "aria-valuetext": text },
      h("p", { className: "np-progress-label" }, text),
      h(Bar, { percent: (current / total) * 100 })
    );
  }

  function AnswerOption(props) {
    var selected = !!props.selected;
    return h(
      "label",
      { className: cx("np-answer", props.className), "data-selected": selected ? "true" : "false" },
      h("input", {
        type: "radio",
        name: props.name,
        value: props.value,
        checked: selected,
        onChange: function () { if (props.onSelect) props.onSelect(props.value); }
      }),
      h("span", { className: "np-marker", "aria-hidden": "true" }),
      h("span", null, props.label || props.children)
    );
  }

  function MatchScore(props) {
    var max = props.max || 100;
    var size = props.size || (props.tone === "secondary" ? "sm" : "lg");
    var label = props.label === undefined ? "Pathway Match Score" : props.label;
    return h(
      "div",
      { className: cx("np-score", "np-score-" + size, props.className) },
      h("p", { className: "np-score-num" }, props.score, h("span", null, "/ " + max)),
      label ? h("p", { className: "np-score-label" }, label) : null,
      h(Bar, { percent: (props.score / max) * 100, tone: props.tone })
    );
  }

  function ResultCard(props) {
    var primary = props.variant !== "secondary";
    var Title = props.headingLevel || (primary ? "h2" : "h3");
    if (primary) {
      return h(
        "article",
        { className: cx("np-result", "np-result-primary", props.className) },
        h("div", null,
          h(Title, { className: "np-result-title" }, props.pathway),
          props.explanation ? h("p", { className: "np-result-text" }, props.explanation) : null,
          props.children),
        h(MatchScore, { score: props.score, max: props.max, label: props.scoreLabel === undefined ? "Strongest Match" : props.scoreLabel, tone: "primary" })
      );
    }
    return h(
      "article",
      { className: cx("np-result", "np-result-secondary", props.className) },
      h(Title, { className: "np-result-title" }, props.pathway),
      h(MatchScore, { score: props.score, max: props.max, label: props.scoreLabel === undefined ? "Pathway Match Score" : props.scoreLabel, tone: "secondary", size: "sm" }),
      props.explanation ? h("p", { className: "np-result-text" }, props.explanation) : null,
      props.children
    );
  }

  function DegreeCard(props) {
    var Title = props.headingLevel || "h3";
    var meta = [props.university, props.country].filter(Boolean).join(" · ");
    return h(
      "article",
      { className: cx("np-degree", props.className) },
      h(Title, { className: "np-degree-title" }, props.title),
      meta ? h("p", { className: "np-degree-meta" }, meta) : null,
      props.children
    );
  }

  function MediaFrame(props) {
    return h(
      "section",
      { className: cx("np-media", props.className), "aria-label": props.label },
      props.label ? h("p", { className: "np-media-label" }, props.label) : null,
      h("div", { className: "np-media-frame", role: props.children ? undefined : "img", "aria-label": props.children ? undefined : props.placeholder },
        props.children || props.placeholder),
      props.actions ? h("div", { className: "np-media-actions" }, props.actions) : null
    );
  }

  function Notice(props) {
    var tone = props.tone || "info";
    return h(
      "div",
      { className: cx("np-notice", "np-notice-" + tone, props.className), role: tone === "danger" ? "alert" : "note" },
      props.title ? h("strong", { className: "np-notice-title" }, props.title) : null,
      props.children
    );
  }

  function LoadingState(props) {
    return h(
      "div",
      { className: cx("np-loading", props.className), role: "status", "aria-live": "polite" },
      h("span", { className: "np-spinner", "aria-hidden": "true" }),
      h("span", null, props.message || "Calculating your matches...")
    );
  }

  var api = {
    Header: Header,
    ThemeToggle: ThemeToggle,
    Button: Button,
    QuestionProgress: QuestionProgress,
    AnswerOption: AnswerOption,
    MatchScore: MatchScore,
    ResultCard: ResultCard,
    DegreeCard: DegreeCard,
    MediaFrame: MediaFrame,
    Notice: Notice,
    LoadingState: LoadingState,
    applyTheme: applyTheme,
    readTheme: readTheme,
    resolveTheme: resolveTheme
  };
  window.NsbmPathway = Object.assign(window.NsbmPathway || {}, api);
})();
