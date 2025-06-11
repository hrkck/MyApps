<script>
  import { contentProperties } from "../../scripts/storage";

  /**
   * @typedef {Object} Props
   * @property {any} [width]
   * * @property {any} [height]
   * * @property {any} [mainContent]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {width, height} = $props();

  let visible = $state(false);
  let timeout;

  export function show(newWidth, newHeight) {
    width = Math.round(newWidth);
    height = Math.round(newHeight);
    visible = true;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      visible = false;
    }, 2000);
  }
</script>

<div class="zoom-indicator" class:visible style="top: 1%; left: 1%;">
  {width} x {height}
</div>

<style>
  .zoom-indicator {
    position: fixed;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 10px;
    font-size: 14px;
    font-family: monospace;
    border-radius: 6px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 900;
  }

  .zoom-indicator.visible {
    opacity: 1;
  }
</style>
