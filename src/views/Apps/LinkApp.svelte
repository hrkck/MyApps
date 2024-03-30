<!-- LinkApp.svelte -->
<script>
  import { afterUpdate, onMount } from "svelte";
  import { getLocalStorage, windowStores } from "../../scripts/storage";

  export let uniqueID;
  const mainAppStore = windowStores[uniqueID];
  export let windowId;
  export let windowIconUrl = "";

  const LinkAppStore = getLocalStorage("linkAppStore-" + windowId, {
    url: windowIconUrl,
  });

  $: windowIconUrl = $LinkAppStore.url;

  function updateImageUrl() {
    let inputUrl = $LinkAppStore.url.trim();

    // Regular expression to match URLs starting with www. or having .com at the end
    const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:\w+\.)*[\w-]+\.[\w]{2,3}(?:\.[\w]{2})?$/i;

    // Check if input URL is not empty and matches the URL pattern
    if (inputUrl !== "" && urlRegex.test(inputUrl)) {
      // Check if input URL doesn't start with http:// or https://
      if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
        // Prepend https:// to the input URL
        inputUrl = `https://${inputUrl}`;
        windowIconUrl = inputUrl;
        // Construct the image URL with the favicon.ico path
        // windowIconSrc = `${inputUrl}/favicon.ico`;
        // console.log(windowIconSrc);
      }
    } else {
      // Clear the image URL and provide feedback for invalid input
      windowIconUrl = "";
      // windowIconSrc = "";
      console.error("Invalid URL entered. Please enter a valid URL.");
    }
  }

  onMount(() => {
    updateImageUrl();
    // windowIconSrc = windowIconUrl;
    console.log(windowIconUrl);
    // console.log(windowIconSrc);
    console.log("fsdfjksndfkjsndfjksdnfkj");
  });

  // afterUpdate(() => {});

  function iconClick(event) {
    // if (hasMoved) {
    //   event.preventDefault();
    //   return;
    // }
    console.log("clicked icon link");
  }
</script>

<label for="url">Enter URL:</label>
<input type="text" id="url" bind:value={$LinkAppStore.url} on:input={updateImageUrl} />

{#if windowIconUrl !== ""}
  <img src={windowIconUrl + "/favicon.ico"} alt="Favicon" class="favicon-image" />
{:else}
  <!-- Display a placeholder or message if no image URL is available -->
  <p>No favicon found</p>
{/if}

<style>
  .favicon-image {
    max-width: 100px; /* Adjust the size as needed */
    max-height: 100px; /* Adjust the size as needed */
  }

  /* Style for the pre-determined icon */
  .icon-link {
    position: relative;
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
</style>
