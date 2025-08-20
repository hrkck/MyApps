<!-- TimeApp.svelte -->
<script>
  // @ts-nocheck

  import { onDestroy, onMount, tick } from "svelte";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { writable } from "svelte/store";
  import { user } from "../../scripts/initGun";
  import { cleanGunData } from "../../scripts/utils";

  let { uniqueID } = $props();
  const mainAppStore = $windowStores[uniqueID];

  const timerData = writable($mainAppStore.timerData || {});
  let liveTime = writable(0);

  let running = $state(false);
  let startTime = $state(0);
  let liveInterval;

  function startTimer() {
    if (!running) {
      running = true;
      startTime = Date.now();
      liveInterval = setInterval(() => {
        liveTime.set(Date.now() - startTime);
      }, 100);
    }
  }

  function stopTimer() {
    if (running) {
      running = false;
      clearInterval(liveInterval);
      const endTime = Date.now();
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0];
      const entryID = `${dateKey}-${endTime}`; // unique key
      const newEntry = { start: startTime, end: endTime, label: "", date: dateKey };

      timerData.update((obj) => {
        return { ...obj, [entryID]: newEntry };
      });

      $mainAppStore.timerData = { ...$timerData };

      user.get("windows").get(uniqueID).get("timeAppData").put($mainAppStore.timerData);

      liveTime.set(0);
    }
  }

  function updateLabel(entryID, value) {
    timerData.update((obj) => {
      if (obj[entryID]) obj[entryID].label = value;
      return { ...obj };
    });

    $mainAppStore.timerData = { ...$timerData };
    user.get("windows").get(uniqueID).get("timeAppData").put($mainAppStore.timerData);
  }

  async function initData() {
    await user
      .get("windows")
      .get(uniqueID)
      .get("timeAppData")
      .map()
      .once((data, key) => {
        if (key != "_" && data) {
          data = cleanGunData(data);
          timerData.update((obj) => {
            return { ...obj, [key]: data };
          });
          $mainAppStore.timerData = { ...$timerData };
        }
      });
  }

  function groupByDate(entriesObj) {
    const grouped = {};
    Object.entries(entriesObj).forEach(([key, e]) => {
      e.id = key; // assign id from GunDB key
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }

  // Returns {top, height} relative to the hour box
  function getFilledBoxes(entry, hour) {
    const entryStart = new Date(entry.start);
    const entryEnd = new Date(entry.end);

    // Start of this hour
    const hourStart =
      hour === entryStart.getHours() ? entryStart : new Date(entryStart).setHours(hour, 0, 0, 0);

    // End of this hour
    const hourEnd =
      hour === entryEnd.getHours() ? entryEnd : new Date(entryStart).setHours(hour + 1, 0, 0, 0);

    const startMinutes = new Date(hourStart).getMinutes();
    const endMinutes = new Date(hourEnd).getMinutes();

    return {
      top: (startMinutes / 60) * 100,
      height: ((endMinutes - startMinutes) / 60) * 100,
    };
  }

  //   POPUP
  let popupOpen = $state(false);
  let popupEntry = $state(null);
  let popupPosition = $state({ top: 0, left: 0 });

  let popupColor = $state("#4caf50");

  function openPopup(entry, event) {
    popupEntry = entry;
    popupOpen = true;

    // Initialize popupColor
    popupColor = popupEntry.color || "#4caf50";

    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = document
      .getElementById($mainAppStore.uniqueID + "-timeApp")
      .getBoundingClientRect();

    const scale = $contentProperties?.scale || 1;

    popupPosition = {
      top: (rect.bottom - containerRect.top + 5) / scale,
      left: (rect.left - containerRect.left) / scale,
    };

    // popupPosition = {
    //   top: rect.bottom - containerRect.top + 5,
    //   left: rect.left - containerRect.left,
    // };
  }

  function handleColorChange(e) {
    popupColor = e.target.value;
    updatePopupColor(popupColor);
  }

  //   function openPopup(entry, event) {
  //     popupEntry = entry;
  //     popupOpen = true;

  //     const rect = event.currentTarget.getBoundingClientRect();
  //     popupPosition = { top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX };
  //   }

  function closePopup() {
    popupOpen = false;
    popupEntry = null;
  }

function updatePopupLabel(value) {
  if (!popupEntry) return;

  const updatedEntry = { ...popupEntry, label: value };

  timerData.update((obj) => {
    return {
      ...obj,
      [updatedEntry.id]: updatedEntry,
    };
  });

  const newTimerData = { ...$timerData, [updatedEntry.id]: updatedEntry };
  $mainAppStore.timerData = newTimerData;
  user.get("windows").get(uniqueID).get("timeAppData").put(newTimerData);

  popupEntry = updatedEntry; // reassign at the end
}


  function updatePopupColor(value) {
    if (!popupEntry) return;

    const updatedEntry = { ...popupEntry, color: value };

    timerData.update((obj) => {
      return {
        ...obj,
        [updatedEntry.id]: updatedEntry,
      };
    });

    // ensure sync with store and GunDB
    const newTimerData = { ...$timerData, [updatedEntry.id]: updatedEntry };
    $mainAppStore.timerData = newTimerData;
    user.get("windows").get(uniqueID).get("timeAppData").put(newTimerData);

    popupEntry = updatedEntry; // reassign at the end, safe non-reactive
  }

  // close popup on outside click
  // close popup on outside click
  function handleClickOutside(event) {
    if (popupOpen && !event.target.closest(".popup")) {
      closePopup();
    }
  }

  onMount(() => {
    initData();
    // document.addEventListener("click", handleClickOutside);
  });

  // clean up
  onDestroy(() => {
    // document.removeEventListener("click", handleClickOutside);
  });
</script>

<svelte:window on:click|capture={handleClickOutside} />

<div class="main" id={$mainAppStore.uniqueID + "-timeApp"}>
  <div class="controls">
    <button onclick={startTimer} disabled={running}>Start Timer</button>
    <button onclick={stopTimer} disabled={!running}>Stop Timer</button>
    {#if running}
      <span>Running: {($liveTime / 1000).toFixed(1)} s</span>
    {/if}
  </div>

  <div class="columns">
    {#each Object.entries(groupByDate($timerData)) as [date, entries]}
      <div class="column">
        <h3>{date}</h3>
        <div class="day-grid">
          {#each Array(24) as _, hour}
            <div class="hour-box">
              <span class="hour-number">{hour.toString().padStart(2, "0")}</span>
              {#each entries as entry}
                {#if entry.start <= new Date().setHours(hour + 1, 0, 0, 0) && entry.end >= new Date().setHours(hour, 0, 0, 0)}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="filled"
                    style="
        top: {getFilledBoxes(entry, hour).top}%;
        height: {getFilledBoxes(entry, hour).height}%;
        background-color: {entry.color || '#4caf50'};
      "
                    onclick={(e) => openPopup({ ...entry, id: entry.id }, e)}
                  >
                    <span class="label-text">{entry.label}</span>
                  </div>
                {/if}
              {/each}
            </div>
          {/each}
        </div>

        {#each entries as entry, index}
          <div class="label-entry">
            <input
              type="text"
              placeholder="Label"
              value={entry.label}
              oninput={(e) => updateLabel(index, e.target.value)}
            />
          </div>
        {/each}
      </div>
    {/each}
  </div>

  {#if popupOpen}
    <div class="popup" style="top: {popupPosition.top}px; left: {popupPosition.left}px;">
      <button class="close-btn" onclick={closePopup}>×</button>
      <div class="popup-content">
        <input
          type="text"
          placeholder="Label"
          value={popupEntry.label}
          oninput={(e) => updatePopupLabel(e.target.value)}
        />
        <label>
          Color:
          <input type="color" value={popupColor} oninput={handleColorChange} />
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .main {
  }

  .label-text {
    display: block;
    width: 100%;
    height: 100%;
    font-size: 12px;
    color: white;
    padding: 2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    pointer-events: none; /* so click passes to filled div */
  }
  .popup {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    padding: 8px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    min-width: 180px;
  }

  .popup .close-btn {
    position: absolute;
    top: 2px;
    right: 4px;
    border: none;
    background: none;
    font-size: 16px;
    cursor: pointer;
  }

  .popup-content input[type="text"] {
    width: 100%;
    margin-bottom: 6px;
  }

  .popup-content input[type="color"] {
    width: 100%;
    height: 30px;
    border: none;
    padding: 0;
  }

  .hour-number {
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 10px;
    color: #555;
    z-index: 10;
    pointer-events: none;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  button {
    padding: 6px 12px;
    font-size: 14px;
  }

  .columns {
    display: flex;
    gap: 20px;
    overflow-x: auto;
  }

  .column {
    display: flex;
    flex-direction: column;
    /* min-width: 150px; */
  }

  h3 {
    text-align: center;
    margin-bottom: 5px;
  }

  .day-grid {
    display: grid;
    grid-template-rows: repeat(24, 80px);
    gap: 2px;
    border: 1px solid #ccc;
    margin-bottom: 10px;
  }

  .hour-box {
    position: relative;
    border: 1px solid #eee;
  }

  .filled {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #4caf50;
  }

  .label-entry input {
    width: 100%;
    padding: 4px;
    margin-bottom: 2px;
  }
</style>
