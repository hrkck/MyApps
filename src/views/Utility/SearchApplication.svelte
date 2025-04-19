<script>
  import { run, createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  

  /**
   * @typedef {Object} Props
   * @property {any} applications - import { addWindow } from "../../js/utils.js";
   */

  /** @type {Props} */
  let { applications } = $props();

  let searchQuery = $state("");
  let searchResults = $state([]);

  function onSearchResultClick(result) {
    // addWindow(result);
    searchQuery = "";
    searchResults = [];
  }

  function fuzzySearch(query) {
    return applications.filter((app) =>
      app.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  run(() => {
    searchResults = searchQuery ? fuzzySearch(searchQuery) : [];
  });
</script>

<div id="searchBox">
  <input
    type="text"
    id="search"
    bind:value={searchQuery}
    placeholder="Search Applications"
  />
  <ul id="searchResults">
    {#each searchResults as result}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <li onkeydown={bubble('keydown')} onkeyup={bubble('keyup')} onkeypress={bubble('keypress')} onclick={(e) => onSearchResultClick(result)}>
        {result.name}
      </li>
    {/each}
  </ul>
</div>


<style>
  #searchBox {
    /* margin-left: auto; */
  }

  #search {
    border-radius: 200px;
    border: 0;
  }

  #searchResults {
    position: absolute;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  #searchResults li {
    background-color: rgb(255, 255, 255);
    min-width: 200px;
    cursor: pointer;
    padding: 5px;
    margin-top: 5px;
    border-radius: 200px;

  }
</style>
