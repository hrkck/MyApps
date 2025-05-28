<script>
  import data from "../../scripts/data/farketmezData.json";

  let { uniqueID } = $props();

  let location = $state("");
  let suggestion = $state(null);

  async function suggestFood() {
    // const city = location.toLowerCase();
    // const response = await fetch("../../scripts/data/farketmezData.json");
    // const data = await response.json();

    // if (!data[city]) {
    //   suggestion = { error: "No data found for this location." };
    //   return;
    // }

    const city = location.toLowerCase();
    if (!data[city]) {
      suggestion = { error: "No data found for this location." };
      return;
    }

    const stores = data[city];
    const storeNames = Object.keys(stores);
    const randomStoreName = storeNames[Math.floor(Math.random() * storeNames.length)];
    const store = stores[randomStoreName];

    const categories = Object.keys(store).filter((key) => key !== "address");
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const items = store[randomCategory];
    const itemNames = Object.keys(items);
    const randomItemName = itemNames[Math.floor(Math.random() * itemNames.length)];

    suggestion = {
      storeName: randomStoreName,
      address: store.address,
      foodName: randomItemName,
      price: items[randomItemName],
      category: randomCategory,
    };
  }
</script>

<main>
  <h1>🍽️ Food Suggester</h1>

  <input type="text" bind:value={location} placeholder="Enter location (e.g. Istanbul)" />
  <button on:click={suggestFood} disabled={!location}>Suggest</button>

  {#if suggestion}
    {#if suggestion.error}
      <p style="color: red;">{suggestion.error}</p>
    {:else}
      <div class="suggestion">
        <h2>🎯 Suggestion</h2>
        <p><strong>Food:</strong> {suggestion.foodName} ({suggestion.category})</p>
        <p><strong>Price:</strong> {suggestion.price}</p>
        <p><strong>Store:</strong> {suggestion.storeName}</p>
        <p><strong>Address:</strong> {suggestion.address}</p>
      </div>
    {/if}
  {/if}
</main>

<style>
  main {
    font-family: sans-serif;
    max-width: 600px;
    margin: 2rem auto;
    text-align: center;
  }

  input {
    padding: 0.5rem;
    margin-right: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
  }

  .suggestion {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f3f3f3;
    border-radius: 0.5rem;
  }
</style>
