<script>
  export let label;
  export let onClick;
  export let color = "initial"; // Default color if not provided

  function handleClick(event) {
    if (typeof onClick === "function") {
      onClick(event);
    }
  }

  function handleKeydown(event) {
    console.log("event triggered");
    // Check if the key pressed is Enter or Space
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default behavior
      handleClick(event); // Trigger the click handler
    } else if (event.key === " ") {
      event.preventDefault(); // Prevent default scrolling behavior
      handleClick(event); // Trigger the click handler
    }
  }
</script>

<div
  class="context-menu-item"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  style="background-color: {color};"
>
  {label}
</div>

<style>
  .context-menu-item {
    cursor: pointer;
    padding: 10px 50px 10px 10px;
    outline: none;
  }

  .context-menu-item:hover,
  .context-menu-item:focus {
    background-color: #d6d6d6 !important; 
    height: 50px;
  }
</style>
