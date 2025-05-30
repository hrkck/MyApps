<script>
  let x = 0;
  let y = 0;
  let isDragging = false;
  let offsetX, offsetY;

  function handleMouseDown(event) {
    isDragging = true;
    offsetX = event.clientX - x;
    offsetY = event.clientY - y;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event) {
    if (!isDragging) return;
    x = event.clientX - offsetX;
    y = event.clientY - offsetY;
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="draggable" on:mousedown={handleMouseDown} style="transform: translate({x}px, {y}px);">
  Drag me!
</div>

<style>
  .draggable {
    position: absolute;
    cursor: grab;
    user-select: none;
    background: #f0f0f0;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    width: fit-content;
  }
</style>
