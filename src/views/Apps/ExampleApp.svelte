<script>
  import { onDestroy } from "svelte";

  export let uniqueID;
  let count = 0;

  let currentTime = "";
  let currentDate = "";

  function increment() {
    count += 1;
  }

  function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const weekday = now.toLocaleString("default", { weekday: "long" });

    currentTime = `${hours}:${minutes}:${seconds}`;
    currentDate = `${day}.${month}.${year} \n ${weekday}`;
  }

  // Update time every second
  const interval = setInterval(updateTime, 1000);

  // Ensure interval is cleared when the component is destroyed
  onDestroy(() => {
    clearInterval(interval);
  });

  // Initialize the time and date immediately
  updateTime();
</script>

<div class="example-app">
  <p>uniqueID: {uniqueID}</p>
  <p>count: {count}</p>
  <input type="button" value="increment" on:click={increment} />
  <br />
  <br>
  <p>Time: {currentTime}</p>
  <p>Date: {currentDate}</p>
</div>

<style>
  .example-app {
    width: 100%;
    height: 100%;
    align-content: center;
    text-align: center;
  }
  p {
    margin: 0;
    padding: 0;
    line-height: 1.5;
    align-items: center;
  }
</style>
