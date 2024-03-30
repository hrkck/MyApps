<script>
  // import { addWindow } from "../../js/utils.js";

  export let applications;

  let searchQuery = "";
  let searchResults = [];

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

  $: searchResults = searchQuery ? fuzzySearch(searchQuery) : [];
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
      <li on:keydown on:keyup on:keypress on:click={(e) => onSearchResultClick(result)}>
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
