<script>
  export let windowId;

  function onClick(event) {
    console.log("clicking on text area");
    event.stopPropagation();
    // event.preventDefault();
  }
</script>

<!-- <div on:mousedown={(e)=>onClick(e)} on:keydown={(e)=>onClick(e)}> -->
<div>
  <p>Text Editor App</p>
  <textarea id="text-area"></textarea>
</div>

<style>
</style>
