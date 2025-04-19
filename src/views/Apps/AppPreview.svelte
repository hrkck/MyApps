<!-- AppPreview.svelte -->
<script>
  import { onMount } from "svelte";
  import { user } from "../../scripts/initGun";
  import { writable } from "svelte/store";
  import { windowStores } from "../../scripts/storage";

  let { uniqueID } = $props();
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

  function goToUrl() {
    window.location = $iconData.linkUrl;
  }

  function clickHandle(node) {
    node.addEventListener("mousedown", mouseDown);
    node.addEventListener("touchstart", mouseDown);

    let initX, initY;
    let delta;
    function mouseDown(e) {
      initX = $mainAppStore.x;
      initY = $mainAppStore.y;
      delta = 0;
      node.addEventListener("mousemove", mouseMove);
      node.addEventListener("mouseup", mouseEnd);
      node.addEventListener("touchmove", mouseDown);
      node.addEventListener("touchend", mouseDown);
    }
    function mouseMove(e) {
      let newX = $mainAppStore.x;
      let newY = $mainAppStore.y;
      delta = initX - newX + (initY - newY);
    }
    function mouseEnd(e) {
      e.preventDefault();
      if (delta) {
        initX = 0;
        initY = 0;
        delta = 0;
      } else {
        // go to URL if no movement took place
        // goToUrl();
      }
      node.removeEventListener("mousedown", mouseMove);
      node.removeEventListener("mousemove", mouseDown);
      node.removeEventListener("mouseup", mouseEnd);
      node.removeEventListener("touchstart", mouseMove);
      node.removeEventListener("touchmove", mouseDown);
      node.removeEventListener("touchend", mouseEnd);
    }
  }
</script>

<div class="link-container" id={$mainAppStore.uniqueID + "-appPreview"}>
  {#if isLinkApp}
    <div class="icon-link" use:clickHandle>
      <a href="{$mainAppStore.linkUrl}" target="_blank" style="width: 100%; height:100%;">
        <img src={$iconData.iconUrl} alt="Icon" class="icon" style="width: 100%; height:100%;"/>
      </a>
    </div>
  {:else}
    <!-- else content here -->
    <img src={$iconData.iconUrl} alt="Icon" class="icon" />
  {/if}
</div>

<style>
  .link-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon {
    position: relative;
    width: 50%;
    height: auto;
    z-index: 0;
  }
  .icon-link {
    width: 50%;
    height: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid black;
    cursor: pointer;
  }
</style>
