<script>
  import { addWindow, addWindowGroup } from "../../js/utils";
  import { resetLocalStorage } from "../../store";
  import { applications, applicationGroups } from "../../applicationsList";

  let contextmenu;
  export let hideContextMenu;
  export let contextMenuX = 0;
  export let contextMenuY = 0;
  export let screenContextX = 0;
  export let screenContextY = 0;

  let menuItems = [
    {
      label: "Add Application",
      submenu: applications.map((app) => app.name),
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
    hideContextMenu();
  }

  function handleSubmenuClick(option, type) {
    if (type == "singleApp"){
      addWindow(
        applications.find((app) => app.name == option),
        screenContextX,
        screenContextY
      );
    }else if(type == "groupApp"){
      addWindowGroup(
        applicationGroups.find((app) => app.groupName == option),
        screenContextX,
        screenContextY
      );
    }
      
    hideContextMenu();
  }

  function handleBrowserContextMenu(event) {
    // Do nothing, allowing the default browser context menu to appear
    // console.log('dispatching a right click event');
    // const rightClickEvent = new MouseEvent("contextmenu", {
    //   bubbles: true,
    //   cancelable: true,
    //   view: window,
    //   button: 3, // Button code for right-click (2)
    //   buttons: 0,
    // });
    // contextmenu.dispatchEvent(rightClickEvent);
    // console.log(newwindow.MouseEvent("contextmenu"));
  }
</script>

<div
  class="context-menu"
  style="position: absolute; left: {contextMenuX - 10}px; top: {contextMenuY -
    10}px;"
  on:keydown
  on:keyup
  on:keypress
  on:mouseleave={(e) => {
    hideContextMenu();
  }}
  bind:this={contextmenu}
>
  <ul>
    {#each menuItems as item, index}
      <li
        on:focus
        on:mouseover={() => (submenuVisible[index] = true)}
        on:mouseleave={() => (submenuVisible[index] = false)}
        on:contextmenu|preventDefault={() => {}}
      >
        {#if item.submenu.length > 0}
          {item.label}
          <ul>
            {#if submenuVisible[index]}
              {#each item.submenu as subOption}
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
          <li
            on:click={click}
            on:keydown
            on:keyup
            on:keypress
            style="background-color:{item.color};"
          >
            {item.label}
          </li>
        {/if}
      </li>
    {/each}
    <li on:contextmenu={handleBrowserContextMenu}>
      Right Click Here For Default Menu
    </li>
  </ul>
</div>

<style>
  .context-menu {
    background-color: #fff;
    border: 1px solid #ccc;
    z-index: 1000;
    padding: 15px 0 15px 15px;
  }
  .context-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .context-menu li {
    cursor: pointer;
    padding: 5px;
  }
  .context-menu li:hover {
    background-color: #f0f0f0;
    height: 50px;
  }
  .context-menu li ul {
    list-style: none;
    border: 1px solid #ccc;
    background-color: #fff;
    display: none;
    position: absolute;
    left: 100%;
    top: inherit;
    width: 50%;
  }
  .context-menu li ul li {
    border-bottom: 1px solid black;
  }
  .context-menu li:hover ul {
    display: inline-block;
  }
</style>
