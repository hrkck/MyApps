<script>
  import { applicationGroups, applications } from "../../../scripts/applicationsList";
  import { contextMenu, resetLocalStorage } from "../../../scripts/storage";
  import { addWindow, addWindowGroup } from "../../../scripts/utils";

  let menuItems = [
    {
      label: "Add Application",
      submenu: applications.map((app) => app.title),
      type: "singleApp",
    },
    {
      label: "Add Application Group",
      submenu: applicationGroups.map((appGroup) => appGroup.groupName),
      type: "groupApp",
    },
    {
      label: "Option 3",
      submenu: ["Sub Option A", "Sub Option B", "Sub Option C"],
    },
    {
      label: "Option 4",
      submenu: ["Sub Option X", "Sub Option Y", "Sub Option Z"],
    },
    { label: "Reset Storage", submenu: [], color: "indianred" }, // Add submenu options as needed
  ];

  let submenuVisible = Array(menuItems.length).fill(false);

  function click(event) {
    if (event.target.innerText == "Reset Storage") {
      resetLocalStorage();
    }
    $contextMenu.visible = false;
  }

  function handleSubmenuClick(option, type) {
    if (type == "singleApp") {
      addWindow(
        applications.find((app) => app.title == option),
        $contextMenu.screenX,
        $contextMenu.screenY
      );
    } else if (type == "groupApp") {
      addWindowGroup(
        applicationGroups.find((app) => app.groupName == option),
        $contextMenu.screenX,
        $contextMenu.screenY
      );
    }

    $contextMenu.visible = false;
  }

  function handleBrowserContextMenu(event) {
    // Do nothing, allowing the default browser context menu to appear
  }
</script>

<ul>
  {#each menuItems as item, index}
    <li
      on:focus
      on:blur
      on:mouseover={() => {
        submenuVisible[index] = true;
      }}
      on:mouseleave|preventDefault={() => {
        submenuVisible[index] = false;
      }}
    >
      {#if item.submenu.length > 0}
        {item.label}
        <ul>
          {#if submenuVisible[index]}
            {#each item.submenu as subOption}
              <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
              <li
                on:click={() => handleSubmenuClick(subOption, item.type)}
                on:keydown
                on:keyup
                on:keypress
              >
                {subOption}
              </li>
            {/each}
          {/if}
        </ul>
      {:else}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li on:click={click} on:keydown on:keyup on:keypress style="background-color:{item.color};">
          {item.label}
        </li>
      {/if}
    </li>
  {/each}
  <li on:contextmenu|stopPropagation={handleBrowserContextMenu}>
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
