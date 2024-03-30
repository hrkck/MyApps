<script>
  export let uniqueID;
  let count = 0;

  function increment() {
    count += 1;
  }
</script>

<p>uniqueID:{uniqueID}</p>
<p>count: {count}</p>
<input type="button" value="increment" on:click={() => increment()} />

<style>
</style>
