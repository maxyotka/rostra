# Browser support

Two builds that do not interfere with each other: a modern browser loads only
`rostra.css`, an old one only `rostra.legacy.css`. They look the same.

| Build | Browsers |
| --- | --- |
| `rostra.css` | Chrome 84+, Firefox 63+, Safari 14.1+, Edge 84+, iOS 14.5+ |
| `rostra.legacy.css` | IE10+, Chrome 21+, Firefox 28+, Safari 6.1+, iOS 7+, Opera 15+ |

Both floors come from caniuse data rather than guesswork:

```bash
npm run check:support
```

The report names the feature that sets each limit. For the modern build it is
`gap` in flexbox; the oldest point covered by the legacy build is September
2012.

## Going lower is pointless: TLS, not CSS

A browser without TLS 1.2 will not establish a connection to a modern server
and never reaches the stylesheet at all. TLS 1.2 arrived in Chrome 29,
Firefox 27, Safari 7, IE11 and Opera 16 — all 2013–2014.

So over HTTPS the real audience is Chrome 29+, Firefox 27+, Safari 7+ and IE11,
and the legacy build covers that range with room to spare. Chrome 21 and IE10
are supported in CSS but will not open the site over HTTPS anyway. The margin
only matters on an internal network over plain HTTP.

## Below IE10 the requirement contradicts itself

IE9 and IE8 have no flexbox at all. Supporting them means rewriting every
layout on floats and tables, at which point "the layout looks roughly the same"
stops being true — that would be a different system, not another build of this
one. IE10 is the last point where `-ms-flexbox` still produces the same layout.

The same boundary applies to Chrome and Firefox: before Chrome 21 and
Firefox 28, flexbox existed only in the 2009 syntax (`display: box`) with no
line wrapping. Autoprefixer can emit it, but the result would not match.

## Serving both builds

IE10 and IE11 can be targeted with a media query the rest of the world ignores:

```html
<link rel="stylesheet" href="rostra.css">
<link rel="stylesheet" href="rostra.legacy.css"
      media="screen and (-ms-high-contrast: active), (-ms-high-contrast: none)">
```

Old Chrome, Firefox and Safari cannot be told apart that way. For them, test
for custom property support:

```html
<script>
  if (!window.CSS || !CSS.supports('--rs-test', '0')) {
    document.write('<link rel="stylesheet" href="rostra.legacy.css">')
  }
</script>
```

## How the legacy build differs

- **Theme and density are fixed at build time.** There are no custom
  properties, so switching at runtime is impossible — another theme is another
  file: `node scripts/build-legacy.mjs --theme=dark --density=compact`.
  Only the light medium build is committed.
- **`gap` becomes margins** on adjacent elements and on pseudo-elements. The
  latter matters: a badge dot and an eyebrow tick are separated from their text
  by `gap`, and an adjacent-sibling selector cannot reach them.
- **`grid` becomes flex and float** — key/value lists, the calendar, the event
  timeline and the mobile navigation are laid out differently but look the same.
- **`oklch` is resolved to sRGB**, and contrast is verified in that form too.
- **The React layer is unavailable.** React 18 and 19 dropped Internet Explorer
  support. In that environment Rostra is a CSS core and the application writes
  its own markup.

## Graceful degradation inside the modern build

Between Chrome 84 and Chrome 111 the browser works but does not know some
features yet. Each has a fallback declared before it, so switching to the
legacy build is unnecessary:

| Feature | Without it |
| --- | --- |
| `oklch()` | colours come from the sRGB twin: same hue, slightly lower chroma |
| `color-mix()` | alert and danger-button borders are neutral |
| `:focus-visible` | the focus ring also appears on mouse clicks |
| `100dvh` | height falls back to `100vh` |
| `position: sticky` | the first column of a wide table does not pin |
| `:has()` | a disabled control has no "not-allowed" cursor |
| `prefers-reduced-motion` | animations play regardless of the user setting |

`tests/fallbacks.test.ts` enforces this: every declaration using `color-mix()`
or a dynamic viewport unit must have a predecessor, every oklch token must have
an sRGB twin, and every `:focus-visible` rule must have a `:focus` counterpart.

## What has not been verified

The legacy build has not been opened in a real Internet Explorer. It was
checked by stripping everything an old browser would not understand and
rendering the result in Chrome, which catches conversion mistakes — it caught
one — but not the quirks of the IE layout engine itself. IE11 has known flexbox
bugs, and `.rs-app` (a `100vh` flex column with `min-height: 0`) is exactly the
kind of construct that trips them.

Verifying that properly needs a virtual machine or a device cloud.
