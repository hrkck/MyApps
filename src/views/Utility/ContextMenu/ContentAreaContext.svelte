<script>
  import { createBubbler, preventDefault, stopPropagation } from 'svelte/legacy';

  const bubble = createBubbler();
  import { applicationGroups, applications } from "../../../scripts/applicationsList";
  import { contextMenu, resetLocalStorage } from "../../../scripts/storage";
  import { addWindow, addWindowGroup } from "../../../scripts/utils";
  import ContextMenuItem from "./ContextMenuItem.svelte"; // Assume this component is similar to the previous one

  // Define the action functions
  function addSingleApplication(option) {
    addWindow(
      applications.find((app) => app.title == option),
      $contextMenu.screenX,
      $contextMenu.screenY,
    );
    $contextMenu.visible = false;
  }

  function addApplicationGroup(option) {
    addWindowGroup(
      applicationGroups.find((appGroup) => appGroup.groupName == option),
      $contextMenu.screenX,
      $contextMenu.screenY,
    );
    $contextMenu.visible = false;
  }

  function resetStorage() {
    resetLocalStorage();
    $contextMenu.visible = false;
  }

  // Define the menu items with their associated actions
  let menuItems = [
    {
      label: "Add Application",
      submenu: applications.map((app) => ({
        label: app.title,
        action: () => addSingleApplication(app.title),
      })),
      color: "",
    },
    {
      label: "Add Application Group",
      submenu: applicationGroups.map((appGroup) => ({
        label: appGroup.groupName,
        action: () => addApplicationGroup(appGroup.groupName),
      })),
      color: "",
    },

    {
      label: "Reset Storage",
      submenu: [],
      action: resetStorage,
      color: "indianred",
    },
  ];

  let submenuVisible = $state(Array(menuItems.length).fill(false));

  function handleBrowserContextMenu(event) {
    // Do nothing, allowing the default browser context menu to appear
  }
</script>

<ul>
  {#each menuItems as item, index}
    {#if item.submenu.length > 0}
      <li
        onfocus={bubble('focus')}
        onblur={bubble('blur')}
        onmouseover={() => {
          submenuVisible[index] = true;
        }}
        onmouseleave={preventDefault(() => {
          submenuVisible[index] = false;
        })}
      >
        {item.label}
        <ul class="ghost-slate">
          {#if submenuVisible[index]}
            {#each item.submenu as subOption}
              <!-- <li> -->
              <ContextMenuItem
                label={subOption.label}
                onClick={subOption.action}
                color={item.color}
              />
              <!-- </li> -->
            {/each}
          {/if}
        </ul>
      </li>
    {:else}
      <ContextMenuItem label={item.label} onClick={item.action} color={item.color} />
    {/if}
  {/each}
  <li oncontextmenu={stopPropagation(handleBrowserContextMenu)}>
    Right-Click Here For Default Menu
  </li>
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    cursor: pointer;
    padding: 10px 50px 10px 10px;
  }
  li:hover {
    background-color: #d6d6d6;
    height: 50px;
  }
  li ul {
    list-style: none;
    border: 1px solid #ccc;
    display: none;
    position: absolute;
    left: 100%;
    width: 100%;
  }
  li:hover ul {
    display: initial;
  }
</style>
