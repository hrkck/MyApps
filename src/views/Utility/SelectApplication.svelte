<script>
  import { addWindow } from "../../scripts/utils";

  let defaultSelection = $state("default");
  let { applications } = $props();

  function onSelectionChange(e) {
    defaultSelection = "default";
    addWindow(applications.find((app) => app.id === parseInt(e.target.value)));
  }
</script>

<div id="appDropdown">
  <div>
    <label for="applications">Add Application:</label>
  </div>
  <div>
    <select id="applications" bind:value={defaultSelection} onchange={onSelectionChange}>
      <option value="default">-- List</option>
      {#each applications as app}
        <option value={app.id}>{app.name}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  #appDropdown {
    display: flex;
    flex-flow: row wrap;
    background-color: rgb(255, 255, 255);
    padding: 2px 20px 2px 20px;
    border-radius: 10px;
  }

  label {
    display: inline;
  }

  select {
    display: inline;
    border: 0;
    border-radius: 200px;
  }
</style>
