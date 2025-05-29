<!-- Settings.svelte -->
<script>
  import { preventDefault, stopPropagation } from "svelte/legacy";

  // import { resetLocalStorage } from "../../store.js";
  import { writable } from "svelte/store";
  import { contentProperties, resetLocalStorage } from "../../scripts/storage";
  import Login from "./Login.svelte";
  import { deactivateWindow } from "../../scripts/utils";
  import SEA from "gun/sea";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import { customConfirm, handleConfirmResponse, message, visible } from "../../scripts/confirm";

  let { isSettingsOpen = writable(false) } = $props();
  const activeTab = writable("Login/Register/Sync");

  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "fullscreen-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(180, 180, 180, 0.3)", // semi-transparent
      zIndex: "500",
      pointerEvents: "none", // optional: allows clicks to pass through
    });
    document.body.appendChild(overlay);
  }

  function destroyOverlay() {
    const overlay = document.getElementById("fullscreen-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  export function handleToggleSettings(e) {
    $isSettingsOpen = !$isSettingsOpen;
    $isSettingsOpen? createOverlay()  : destroyOverlay();
    $contentProperties.isAWindowActive = $isSettingsOpen ? "settings" : false;
    if (!$isSettingsOpen) {
      deactivateWindow($contentProperties.activeWindow);
    }
  }

  async function handleClick() {
    const answer = await customConfirm("Do you really want to delete this?");
    if (answer) {
      console.log("Confirmed");
    } else {
      console.log("Cancelled");
    }
  }

  function onConfirmDelete(response) {
    handleConfirmResponse(response);
    resetLocalStorage();
  }

  function onCancelDelete() {
    handleConfirmResponse(false);
  }

  async function handleResetWorkspace() {
    const answer = await customConfirm("Do you really want to delete this?");
    if (answer) {
      console.log("Confirmed");
    } else {
      console.log("Cancelled");
    }
  }

  function setActiveTab(tab) {
    activeTab.set(tab);
  }

  function handleKeyPress(event) {
    if (event.key === "Escape") {
      console.log("ESC presses");
      handleToggleSettings(event);
      if ($contentProperties.isAWindowActivated) {
        deactivateWindow($contentProperties.activeWindow);
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyPress} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="gear-button-container" oncontextmenu={stopPropagation(preventDefault(() => {}))}>
  <button onclick={handleToggleSettings} class="gear-button">&#x2699;</button>
</div>

{#if $isSettingsOpen}
  <div id="settings-background">
    <div id="settings-window">
      <div class="nav-column">
        <button onclick={() => setActiveTab("Login/Register/Sync")}>Login/Register/Sync</button>
        <button onclick={() => setActiveTab("workspace data")}>Workspace Data</button>
        <button onclick={() => setActiveTab("windows data")}>Windows Data</button>
        <button onclick={() => setActiveTab("theme settings")}>Theme Settings</button>
        <button onclick={() => setActiveTab("about")}>About</button>
        <button onclick={() => setActiveTab("Reset Data")}>Reset Data</button>
      </div>
      <div class="content-column">
        {#if $activeTab === "Login/Register/Sync"}
          <Login {handleToggleSettings} />
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
          <button onclick={handleResetWorkspace}>Reset Workspace</button>

          <ConfirmDialog
            bind:visible={$visible}
            bind:message={$message}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  #gear-button-container {
    z-index: 1000;
  }
  .gear-button {
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
    z-index: 501;
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
    overflow-y: scroll;
  }

  button {
    padding: 10px;
    margin: 5px;
    width: calc(100% - 10px); /* Adjust button width considering padding and margin */
  }
</style>
