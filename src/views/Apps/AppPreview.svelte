<!-- AppPreview.svelte -->
<script>
  import { onMount } from "svelte";
  import { user } from "../../scripts/initGun";
  import { writable } from "svelte/store";
  import { windowStores } from "../../scripts/storage";

  export let uniqueID;
  const isLinkApp = uniqueID.split("-")[0] == "linkApp";
  const mainAppStore = windowStores[uniqueID];

  let iconData = writable({
    linkUrl: $mainAppStore.linkUrl || "",
    iconUrl: isLinkApp
      ? `https://www.google.com/s2/favicons?domain=${$mainAppStore.linkUrl}&sz=32`
      : "./icons/icon-192x192.png",
  });

  onMount(async () => {
    if (isLinkApp) initLinkAppData();
  });

  async function initLinkAppData() {
    await user
      .get("windows")
      .get(uniqueID)
      .get("linkAppData")
      .once((data, key) => {
        if (data) {
          data = { ...data, _: "unset-for-svelte" };
          iconData.set(data);
        }
      }); // Retrieve stored data from GunDB
  }

  function goToUrl(){
    window.location = $iconData.linkUrl
  }
</script>

<div class="link-container">
  {#if isLinkApp}
    <a class="icon-link" href={$iconData.linkUrl} >
      <img src={$iconData.iconUrl} alt="Icon" class="on-interactive-icon icon" />
    </a>
  {:else}
    <!-- else content here -->
    <img src={$iconData.iconUrl} alt="Icon" class="non-interactive-icon icon" />
  {/if}
</div>

<style>
  .non-interactive-icon {
    user-select: none;
    pointer-events: none;
  }
  .link-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-link {
    width: 50%;
    height: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid black;
  }
  .icon {
    
    position: relative;
    width: 50%;
    height: auto;
    z-index: 0;
  }
</style>
