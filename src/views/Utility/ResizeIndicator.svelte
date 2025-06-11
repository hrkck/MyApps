<script>
    import { contentProperties } from "../../scripts/storage";

  export let width = 0;
  export let height = 0;
  export let x = 0;
  export let y = 0;
  let visible = false;
  let timeout;

  export function show(newWidth, newHeight, mouseX, mouseY) {
    width = Math.round(newWidth);
    height = Math.round(newHeight);
    x = mouseX;
    y = mouseY;
    visible = true;
  }

  export function hide() {
    visible = false;
  }
</script>

{#if visible}
  <div class="resize-tooltip" style="left: {x + (24)}px; top: {y - 48}px; scale: {1/$contentProperties.scale}">
    {width} x {height}
  </div>
{/if}

<style>
  .resize-tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 12px;
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 900;
    white-space: nowrap;
  }
</style>
