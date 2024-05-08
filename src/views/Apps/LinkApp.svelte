<!-- LinkApp.svelte -->
<script>
  import { afterUpdate, onMount } from "svelte";
  import { getLocalStorage, windowStores } from "../../scripts/storage";
  import { writable } from "svelte/store";
  import { user } from "../../scripts/initGun";

  export let uniqueID;
  const mainAppStore = windowStores[uniqueID];

  const linkData = writable({
    linkUrl: $mainAppStore.linkUrl || "",
    iconUrl: "",
  });

  function updateImageUrl() {
    let inputUrl = $linkData.linkUrl.trim();
    // Regular expression to match URLs starting with www. or having .com at the end
    const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:\w+\.)*[\w-]+\.[\w]{2,3}(?:\.[\w]{2})?$/i;
    // Check if input URL is not empty and matches the URL pattern
    if (inputUrl !== "" && urlRegex.test(inputUrl)) {
      // Check if input URL doesn't start with http:// or https://
      if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
        // Prepend https:// to the input URL
        inputUrl = `https://${inputUrl}`;
      }
      $linkData.linkUrl = inputUrl;
      $linkData.iconUrl = `https://www.google.com/s2/favicons?domain=${inputUrl}&sz=32`;
      // Save updated link and icon URLs to GunDB
      user.get("windows").get(uniqueID).get("linkAppData").get("linkUrl").put($linkData.linkUrl);
      user.get("windows").get(uniqueID).get("linkAppData").get("iconUrl").put($linkData.iconUrl);
    } else {
      // Clear the icon URL and provide feedback for invalid input
      $linkData.iconUrl = "";
      console.error("Invalid URL entered. Please enter a valid URL.");
    }
  }

  onMount(async () => {
    updateImageUrl();
    initData();
  });

  async function initData() {
    await user
      .get("windows")
      .get(uniqueID)
      .get("linkAppData")
      .once((data, key) => {
        if (data) {
          data = { ...data, _: "unset-for-svelte" };
          linkData.set(data);
        }
      }); // Retrieve stored data from GunDB
  }
</script>

<div class="container">
  <label for="url">Enter URL:</label>
  <input type="text" id="url" bind:value={$linkData.linkUrl} on:input={updateImageUrl} />

  {#if $linkData.iconUrl !== ""}
    <div class="favicon-container">
      <img src={$linkData.iconUrl} alt="Favicon" class="favicon-image" />
    </div>
  {:else}
    <!-- Display a placeholder or message if no image URL is available -->
    <p class="no-favicon-msg">No favicon found</p>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }

  label {
    margin-bottom: 10px;
  }

  input[type="text"] {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 300px;
    max-width: 100%;
  }

  .favicon-container {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .favicon-image {
    max-width: 32px;
    max-height: 32px;
    cursor: pointer;
  }

  .no-favicon-msg {
    margin-top: 10px;
    color: #999;
  }
</style>
