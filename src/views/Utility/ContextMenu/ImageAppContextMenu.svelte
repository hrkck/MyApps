<script>
  // @ts-ignore
  import { contextMenu, removeWindowStore } from "../../../scripts/storage";

  let menuItems = [{ label: "Paste Clipboard", submenu: [], color: "white" }];

  function click(event) {
    if (event.target.innerText == "Paste Clipboard") {
      // trigger paste event
      console.log("trigger paste event");
      triggerPasteEvent();
    }
    $contextMenu.visible = false;
  }
</script>

<ul>
  {#each menuItems as item, index}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <li on:click={click} on:keydown on:keyup on:keypress style="background-color:{item.color};">
      {item.label}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    cursor: pointer;
    padding: 5px;
  }
  li:hover {
    background-color: #f0f0f0;
    height: 50px;
  }
  li ul {
    list-style: none;
    border: 1px solid #ccc;
    background-color: #fff;
    display: none;
    position: absolute;
    left: 100%;
    top: inherit;
    width: 50%;
  }
  li ul li {
    border-bottom: 1px solid black;
  }
  li:hover ul {
    display: inline-block;
  }
</style>
