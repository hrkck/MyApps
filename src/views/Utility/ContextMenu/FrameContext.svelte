<script>
  import { contextMenu, removeWindowStore } from "../../../scripts/storage";
  import ContextMenuItem from "./ContextMenuItem.svelte";

  function deleteFrame() {
    let frameID = $contextMenu.originalTargetID.split("-", 2).join("-");
    removeWindowStore(frameID);
    $contextMenu.visible = false;
  }

  let menuItems = [{ label: "Delete Frame", action: deleteFrame, color: "indianred" }];
</script>

<ul>
  {#each menuItems as item, index}
    <ContextMenuItem label={item.label} onClick={() => item.action()} color={item.color} />
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
