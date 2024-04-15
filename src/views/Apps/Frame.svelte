<!-- Frame.svelte -->
<script>
  import DraggableResizable from "../DraggableResizable.svelte";
  import { user } from "../../scripts/gun";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { get } from "svelte/store";
  import app from "../../main";
  import { checkBoundaries, getAppIDsInAFrame } from "../../scripts/utils";
  import { afterUpdate, beforeUpdate, onMount } from "svelte";

  export let uniqueID;
  const store = windowStores[uniqueID];
  $store.contentScale = $contentProperties.scale;

  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    dragMoveFunc: function (store, event, x, y) {
      let appIDs = getAppIDsInAFrame(uniqueID);
      let appStore;
      for (const appID of appIDs) {
        appStore = windowStores[appID];
        appStore.update((appData) => {
          appData.x += x;
          appData.y += y;
          return appData;
        });
      }
    },
    dragEndFunc: function (s, event, x, y) {
      let appIDs = getAppIDsInAFrame(uniqueID);
      let appStore, appX, appY;
      for (const appID of appIDs) {
        appStore = windowStores[appID];
        appX = get(appStore).x;
        appY = get(appStore).y;
        user.get("windows").get(appID).put({ x: appX, y: appY });
      }
      user.get("windows").get(uniqueID).put({ x: x, y: y });
    },
    resizeStartFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    resizeMoveFunc: function (store, event, x, y, width, height) {},
    resizeEndFunc: function (store, event, x, y, width, height) {},
    scaleFunc: function (store, event, x, y, scale) {},
  };

  beforeUpdate(() => {
    windowStores[uniqueID] = store;
  });
</script>

<DraggableResizable {uniqueID} {store} {...draggableFunctions}>
  <div id="{uniqueID}-child" class="frame"></div>
</DraggableResizable>

<style>
  .frame {
    background-color: #dceeff48;
    height: 100%;
    width: 100%;
  }
</style>
