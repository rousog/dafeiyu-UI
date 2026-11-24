/**
 * Host half of 大肥鱼UI (@local/dafeiyu-ui).
 *
 * The capability is pure Client UI: a conversation backdrop plus theme-token
 * overrides. This half only has to exist so the Loader row activates; it
 * registers nothing.
 *
 * Artwork is published through the client module system's own package asset
 * route (`/plugins/<package>/assets/<path>`, backed by the
 * `"./assets/*": "./lib/assets/*"` export in package.json), so no Host route is
 * needed here.
 */
export function apply() {}
