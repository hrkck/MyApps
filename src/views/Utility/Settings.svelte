<!-- Settings.svelte -->
<script>
  // import { resetLocalStorage } from "../../store.js";
  import { writable } from "svelte/store";
  import { contentProperties, resetLocalStorage } from "../../scripts/storage";
  import Login from "./Login.svelte";
  import { deactivateWindow } from "../../scripts/utils";

  let isSettingsOpen = false;
  const activeTab = writable("Login/Register/Sync");

  function handleToggleSettings(e) {
    isSettingsOpen = !isSettingsOpen;
    $contentProperties.backgroundColor = isSettingsOpen ? "rgb(194, 204, 187)": "rgb(248, 255, 243)"
    $contentProperties.isAWindowActive = isSettingsOpen ? "settings" : false;
    if(!isSettingsOpen){
      deactivateWindow($contentProperties.activeWindow)
    }
  }

  function handleResetWorkspace(e) {
    resetLocalStorage();
  }

  function setActiveTab(tab) {
    activeTab.set(tab);
  }
</script>

<div id="settings-button">
  <button on:click={handleToggleSettings} class="gear-button">&#x2699;</button>
  {#if isSettingsOpen}
    <div id="settings-background">
      <div id="settings-window">
        <div class="nav-column">
          <button on:click={() => setActiveTab("Login/Register/Sync")}>Login/Register/Sync</button>
          <button on:click={() => setActiveTab("workspace data")}>Workspace Data</button>
          <button on:click={() => setActiveTab("windows data")}>Windows Data</button>
          <button on:click={() => setActiveTab("theme settings")}>Theme Settings</button>
          <button on:click={() => setActiveTab("about")}>About</button>
          <button on:click={() => setActiveTab("Reset Data")}>Reset Data</button>
        </div>
        <div class="content-column">
          {#if $activeTab === "Login/Register/Sync"}
            <Login />
            <!-- <p>Login/Sync</p> -->
          {/if}
          {#if $activeTab === "workspace data"}
            <p>Workspace data content here</p>
          {/if}
          {#if $activeTab === "windows data"}
            <p>Windows data content here</p>
          {/if}
          {#if $activeTab === "theme settings"}
            <p>Theme settings content here</p>
          {/if}
          {#if $activeTab === "about"}
            <p>Licensed under AGPL-3.0-or-later.</p>
            <p>
              Source code: <a
                href="https://github.com/hrkck/MyApps"
                target="_blank"
                rel="noopener noreferrer">https://github.com/hrkck/MyApps</a
              >
            </p>
          {/if}
          {#if $activeTab === "Reset Data"}
            <h1>RESET ALL DATA</h1>
            <button on:click={handleResetWorkspace}>Reset Workspace</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .gear-button {
    z-index: 1000;
    height: 30px;
    width: 30px;
    padding: 0;
  }

  #settings-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 90%;
    height: 100vh;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0);
    z-index: 0;
    pointer-events: none;
  }
  #settings-window {
    display: flex;
    position: relative;
    vertical-align: middle;
    margin: auto;
    width: 80%;
    height: 90%;
    padding: 20px;
    background-color: rgb(177, 177, 177);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    pointer-events: all;
  }
  .nav-column {
    flex: 1;
    background-color: #f0f0f0;
    display: flex;
    flex-direction: column;
  }

  .content-column {
    flex: 3;
    padding: 20px;
  }

  button {
    padding: 10px;
    margin: 5px;
    width: calc(100% - 10px); /* Adjust button width considering padding and margin */
  }
</style>
