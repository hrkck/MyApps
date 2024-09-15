<script>
  // @ts-ignore
  import { contextMenu, removeWindowStore } from "../../../scripts/storage";
    import ContextMenuItem from "./ContextMenuItem.svelte";

  function deleteAppWindow() {
    let appId = $contextMenu.originalTargetID.split('-', 2).join("-");
    console.log(appId);
    removeWindowStore(appId);
    $contextMenu.visible = false;
  }

  let menuItems = [
    { label: "Delete App Window", action: deleteAppWindow, color: "indianred" }, // Add submenu options as needed
  ];

</script>

<ul>
  {#each menuItems as item, index}
      <ContextMenuItem
        label={item.label} 
        onClick={() => item.action()} 
        color={item.color} 
      />
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
