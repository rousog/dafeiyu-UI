/**
 * Client half of 大肥鱼UI (@local/dafeiyu-ui).
 *
 * A presentation-only plugin with two surfaces:
 *
 *   1. A backdrop behind the Conversation scroll body: scene, figure, scrim.
 *      Each palette gets its own scene and scrim; the character image is shared.
 *   2. A "主题" page in the sidebar navigation rail that switches DSH between
 *      its dark and light palettes through the theme service.
 *
 * Every colour override is emitted for both palettes: the dark block under
 * `body[data-ds-dark-theme]`, the light block under its negation. Nothing here
 * registers tools, writes files, or reads the network beyond this package's own
 * published assets.
 *
 * Wrapped in an IIFE so `PKG` stays local: a top-level `const` in a classic
 * script would throw if the module system ever evaluated this bundle twice in
 * one page.
 */
(() => {
  /*
   * Must equal `package.json`'s `name`: the module loader registers a lazy
   * factory under this id, and the package asset route is built from it. Renaming
   * the package therefore means changing this one constant too.
   */
  const PKG = 'dafeiyu-ui';
  const ASSET_ROUTE = `/plugins/${PKG}/assets`;

  /** Sidebar/main-panel key and ordering for the theme page. */
  const THEME_PANEL_ID = 'dafeiyu-theme';
  const THEME_PANEL_ORDER = 30;

  window.__ModuleLoader__.load({
    id: PKG,
    factory(require) {
      const React = require('react');
      const h = React.createElement;

      /** The character is shared by both palettes; only scene and scrim differ. */
      const FIGURE = {
        file: 'dafeiyu.png',
        /** Character box, as fractions of the frame. */
        width: 0.38,
        centerX: 0.78,
        topGap: 0.1,
      };

      /**
       * Per-palette artwork and chrome colours.
       *
       * `scrim` sits between the artwork and the text: dark mode lowers the
       * scene's luminance so light text reads; light mode raises it so dark text
       * reads. `seatFade` is the composer-seat gradient's endpoint colour, kept
       * in step with `--dsw-alias-bg-base` for the same palette.
       */
      const PALETTES = {
        dark: {
          scene: 'scene-ocean.svg',
          scrim: 'rgba(10, 16, 32, 0.23)',
          seatFade: 'rgba(24, 32, 52, 0.92)',
          seatClear: 'rgba(24, 32, 52, 0)',
          tokens: {
            '--dsw-specific-sidebar-fill': 'rgb(20, 26, 44)',
            '--dsw-specific-input-major': 'rgba(28, 36, 58, 0.72)',
            '--dsw-specific-selector': 'rgba(24, 31, 50, 0.8)',
            /*
             * The canvas fill. Dark mode paints `neutral-bluish-950`
             * (rgb(21,21,23)); it shows up in the right sidebar, the composer
             * seat's fade and the transparent conversation header. Menus and
             * dialogs use `--dsw-specific-menu`, so they keep their material.
             */
            '--dsw-alias-bg-base': 'rgb(24, 32, 52)',
            '--dsw-specific-bubble': 'rgba(34, 44, 70, 0.76)',
            '--dsw-alias-markdown-code-block': 'rgba(26, 34, 56, 0.78)',
            '--dsw-alias-markdown-code-block-banner': 'rgba(32, 41, 65, 0.88)',
            '--dsw-alias-card-fill': 'rgba(30, 39, 62, 0.72)',
            '--dsw-alias-card-fill-hover': 'rgba(37, 47, 73, 0.82)',
            /*
             * The changed-files card's own frame: it paints `.card` with
             * `--dsw-alias-bg-layer-1` and only its inner header with
             * `--dsw-alias-card-fill`, so tinting the fill alone leaves an
             * opaque ring.
             */
            '--dsw-alias-bg-layer-1': 'rgba(30, 39, 62, 0.72)',
            /*
             * Inline code and the code-segment toggle have their own tokens,
             * separate from the fenced block.
             */
            '--dsw-alias-markdown-inline-code': 'rgba(34, 44, 70, 0.8)',
            '--dsw-alias-markdown-code-segment-selected': 'rgba(40, 51, 78, 0.88)',
            '--dsw-alias-markdown-code-segment-unselected': 'rgba(26, 34, 56, 0.78)',
          },
        },
        light: {
          scene: 'scene-sky.svg',
          scrim: 'rgba(255, 255, 255, 0.3)',
          seatFade: 'rgba(238, 243, 251, 0.92)',
          seatClear: 'rgba(238, 243, 251, 0)',
          tokens: {
            '--dsw-specific-sidebar-fill': '#E4ECF7',
            '--dsw-specific-input-major': 'rgba(255, 255, 255, 0.86)',
            '--dsw-specific-selector': 'rgba(240, 246, 253, 0.92)',
            '--dsw-alias-bg-base': '#EEF3FB',
            '--dsw-specific-bubble': 'rgba(206, 227, 250, 0.88)',
            '--dsw-alias-markdown-code-block': 'rgba(233, 241, 251, 0.85)',
            '--dsw-alias-markdown-code-block-banner': 'rgba(226, 236, 249, 0.9)',
            '--dsw-alias-card-fill': 'rgba(255, 255, 255, 0.78)',
            '--dsw-alias-card-fill-hover': 'rgba(248, 251, 255, 0.92)',
            '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.78)',
            '--dsw-alias-markdown-inline-code': 'rgba(226, 236, 249, 0.9)',
            '--dsw-alias-markdown-code-segment-selected': 'rgba(214, 231, 250, 0.92)',
            '--dsw-alias-markdown-code-segment-unselected': 'rgba(233, 241, 251, 0.85)',
          },
        },
      };

      const assetUrl = (file) => `${ASSET_ROUTE}/${encodeURIComponent(file)}`;

      /**
       * Build the stylesheet for one palette.
       *
       * Two robustness measures, both required:
       *
       *   - `!important` on every declaration: the theme plugin injects its own
       *     token sheets into `document.head`, and on a cold start this bundle
       *     can be evaluated *before* ui-theme registers them, which would let
       *     the stock colours win on source order.
       *   - the doubled selector raises specificity above the host's plain
       *     `body` / `body[data-ds-dark-theme]` blocks, so the override also wins
       *     when both agree on order.
       *
       * `36px` in the seat gradient is load-bearing: a `100%` stop puts the
       * target alpha at the element's last pixel, where the visible composer
       * area never reaches it, so the override looks inert.
       */
      function paletteCss(selector, palette) {
        const tokens = Object.entries(palette.tokens)
          .map(([name, value]) => `  ${name}: ${value} !important;`)
          .join('\n');
        return `${selector} {
${tokens}
}
${selector} [data-composer-seat] {
  background: linear-gradient(
    180deg,
    ${palette.seatClear} 0px,
    ${palette.seatFade} 36px
  ) !important;
}
`;
      }

      const DARK_SELECTOR = 'body[data-ds-dark-theme][data-ds-dark-theme]';
      const LIGHT_SELECTOR = 'body:not([data-ds-dark-theme]):not([data-ds-dark-theme])';
      const STYLE_TEXT =
        paletteCss(DARK_SELECTOR, PALETTES.dark)
        + paletteCss(LIGHT_SELECTOR, PALETTES.light);

      return {
        /*
         * `theme` is required to reach `ctx.theme`: reading a service that is not
         * injected throws, and `slots` carries both registrations.
         */
        inject: ['slots', 'theme'],
        apply(ctx) {
          /* ---------------- theme plumbing ---------------- */

          /**
           * Read the theme snapshot, or `null` when the service is unavailable.
           * `active.colorScheme` is already resolved: with the `system`
           * preference the theme service resolved it through
           * `prefers-color-scheme`, so callers never read the media query.
           */
          const readTheme = () => {
            try {
              return ctx.theme.getTheme();
            } catch {
              return null;
            }
          };

          /** Subscribe a component to `theme/change`, re-rendering on a switch. */
          function useThemeSnapshot() {
            const [snapshot, setSnapshot] = React.useState(readTheme);
            React.useEffect(() => ctx.on('theme/change', () => setSnapshot(readTheme())), []);
            return snapshot;
          }

          const isDarkNow = (snapshot) =>
            snapshot === null || snapshot.active.colorScheme === 'dark';

          /**
           * Switch the palette.
           *
           * `setTheme` is the theme service's only preference write entry: it
           * persists through the settings scope, so DSH's own Appearance setting
           * follows, and re-emits `theme/change`. A concrete scheme is passed
           * rather than `system` because a toggle has to reach a definite state.
           */
          const applyTheme = (scheme) => {
            try {
              ctx.theme.setTheme(scheme);
            } catch (error) {
              console.error('[dafeiyu-ui] theme switch failed', error);
            }
          };

          /* ---------------- icons ---------------- */

          function SunMoonIcon(props) {
            const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16;
            const stroke = props.color || 'currentColor';
            return h(
              'svg',
              {
                width: size,
                height: size,
                viewBox: '0 0 24 24',
                fill: 'none',
                'aria-hidden': true,
                focusable: false,
                style: { display: 'block', flex: '0 0 auto' },
              },
              props.dark
                ? h('path', {
                    d: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
                    stroke,
                    strokeWidth: 1.7,
                    strokeLinejoin: 'round',
                  })
                : [
                    h('circle', { key: 'c', cx: 12, cy: 12, r: 4, stroke, strokeWidth: 1.7 }),
                    h('path', {
                      key: 'r',
                      d: 'M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6',
                      stroke,
                      strokeWidth: 1.7,
                      strokeLinecap: 'round',
                    }),
                  ],
            );
          }

          /** Nav-rail icon, shown at ~20px in the sidebar panel list. */
          function ThemePanelIcon(props) {
            const size = typeof props.size === 'number' && props.size > 0 ? props.size : 20;
            return h(SunMoonIcon, {
              dark: true,
              size,
              color: props.active ? 'var(--dsw-alias-brand-primary)' : 'currentColor',
            });
          }

          /* ---------------- theme page ---------------- */

          function ThemePanel() {
            const snapshot = useThemeSnapshot();
            const dark = isDarkNow(snapshot);
            const preference = snapshot === null ? '未知' : snapshot.preference;

            const button = h(
              'button',
              {
                type: 'button',
                'data-dafeiyu-theme-switch': '',
                onClick: () => applyTheme(dark ? 'light' : 'dark'),
                style: {
                  appearance: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxSizing: 'border-box',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--dsw-alias-border-l2)',
                  background: 'var(--dsw-alias-bg-layer-1)',
                  color: 'var(--dsw-alias-label-primary)',
                  font: 'inherit',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                },
              },
              h(SunMoonIcon, { dark, size: 18 }),
              dark ? '切换到浅色模式' : '切换到深色模式',
            );

            return h(
              'div',
              {
                style: {
                  boxSizing: 'border-box',
                  height: '100%',
                  minHeight: 0,
                  overflowY: 'auto',
                  background: 'var(--dsw-alias-bg-base)',
                  color: 'var(--dsw-alias-label-primary)',
                },
              },
              h(
                'div',
                {
                  style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    maxWidth: '680px',
                    margin: '0 auto',
                    padding: '40px 32px 56px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  },
                },
                h(
                  'div',
                  null,
                  h('div', { style: { fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em' } }, '主题'),
                  h(
                    'div',
                    { style: { marginTop: '6px', fontSize: '13px', color: 'var(--dsw-alias-label-secondary)' } },
                    '切换 DSH 的深色与浅色配色。这里写入的是 DSH 自己的外观设置，和「设置 → 通用 → 外观」是同一份数据。',
                  ),
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--dsw-alias-border-l1)',
                      background: 'var(--dsw-alias-bg-layer-1)',
                    },
                  },
                  h(
                    'div',
                    { style: { minWidth: 0 } },
                    h('div', { style: { fontSize: '14px', fontWeight: 600 } }, dark ? '当前：深色' : '当前：浅色'),
                    h(
                      'div',
                      { style: { marginTop: '4px', fontSize: '12.5px', color: 'var(--dsw-alias-label-secondary)' } },
                      `偏好设置：${preference}`,
                    ),
                  ),
                  button,
                ),
                h(
                  'div',
                  {
                    style: {
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px dashed var(--dsw-alias-border-l2)',
                      fontSize: '12.5px',
                      lineHeight: 1.6,
                      color: 'var(--dsw-alias-label-secondary)',
                    },
                  },
                  '两套底图：深色用深海场景，浅色用浅海天光；鲨鱼娘在两种模式下共用同一张图。',
                ),
              ),
            );
          }

          /* ---------------- conversation backdrop ---------------- */

          /**
           * Three stacked layers behind the Conversation scroll body.
           *
           * `conversation.hero.frame` is a root-scoped `hoc` slot: the shell calls
           * it with `{ hero }` and a `children` element that IS the scroll body,
           * so an occupant must pass `children` through unchanged.
           *
           * Stacking: the slot contract only guarantees that a negative-z-index
           * layer paints above the root's background during the `hero` phase. In
           * other phases the root leaves the stacking order, so this paints
           * forward instead: artwork at `z-index: 0`, and the scroll body raised
           * to `z-index: 1` through a `display: contents` wrapper that keeps it a
           * direct flex item.
           */
          function ConversationBackdrop(props) {
            const snapshot = useThemeSnapshot();
            const palette = isDarkNow(snapshot) ? PALETTES.dark : PALETTES.light;

            return h(
              React.Fragment,
              null,
              h(
                'div',
                {
                  key: 'chrome',
                  'aria-hidden': true,
                  'data-dafeiyu-ui-backdrop': '',
                  style: {
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  },
                },
                h('div', {
                  key: 'scene',
                  style: {
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url("${assetUrl(palette.scene)}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  },
                }),
                h('div', {
                  key: 'figure',
                  style: {
                    position: 'absolute',
                    bottom: 0,
                    left: `${(FIGURE.centerX - FIGURE.width / 2) * 100}%`,
                    width: `${FIGURE.width * 100}%`,
                    top: `${FIGURE.topGap * 100}%`,
                    backgroundImage: `url("${assetUrl(FIGURE.file)}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'bottom center',
                    backgroundRepeat: 'no-repeat',
                  },
                }),
                h('div', {
                  key: 'scrim',
                  style: { position: 'absolute', inset: 0, background: palette.scrim },
                }),
              ),
              h(
                'div',
                {
                  key: 'content',
                  style: { display: 'contents', position: 'relative', zIndex: 1 },
                },
                props.children,
              ),
            );
          }

          /* ---------------- registrations ---------------- */

          ctx.slots.inject('conversation.hero.frame', () =>
            ctx.slots.register(
              { name: 'conversation.hero.frame', id: 'dafeiyu-ui-backdrop' },
              ConversationBackdrop,
            ),
          );

          /*
           * The theme page itself, then its launcher in the sidebar navigation
           * rail. `sidebar.panellist` rows are panel launchers keyed by the main
           * panel id, which is what "an entry in the nav area that opens a page"
           * means here.
           */
          ctx.slots.inject('main', () =>
            ctx.slots.register({ name: 'main', key: THEME_PANEL_ID }, ThemePanel),
          );

          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: THEME_PANEL_ID,
                order: THEME_PANEL_ORDER,
                label: () => '主题',
              },
              ThemePanelIcon,
            ),
          );

          /* Publish both palettes' overrides; `ctx.effect` owns the <style>. */
          ctx.effect(() => {
            const style = document.createElement('style');
            style.setAttribute('data-dafeiyu-ui', 'chrome-tokens');
            style.textContent = STYLE_TEXT;
            document.head.appendChild(style);
            return () => style.remove();
          });
        },
      };
    },
  });
})();
