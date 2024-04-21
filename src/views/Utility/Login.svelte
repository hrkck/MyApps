<!-- Login.svelte -->
<script>
  import { onMount } from "svelte";
  import { gun, user } from "../../scripts/gun";
  import SEA from "gun/sea";

  let alias = "";
  let pass = "";
  let showPassword = false; // State variable to toggle password visibility
  let passwordInputType = "password";

  onMount(async () => {
    // Listen for authentication changes
    gun.on("auth", () => {
      console.log("User is authenticated");
    });

    if (user.is) {
      const encryptedAlias = localStorage.getItem("encryptedAlias");
      const encryptedPass = localStorage.getItem("encryptedPass");
      const pairSerialized = localStorage.getItem("pair");

      if (encryptedAlias && encryptedPass && pairSerialized) {
        const pair = JSON.parse(pairSerialized); // Deserialize the pair
        alias = await SEA.decrypt(encryptedAlias, pair);
        pass = await SEA.decrypt(encryptedPass, pair);
      }
    }
  });

  const signUp = () => {
    user.create(alias, pass, async (ack) => {
      if (ack.err) {
        console.error("Sign-up error:", ack.err);
        // Handle sign-up error (e.g., user already exists)
      } else {
        console.log("Sign-up successful:", ack);

        // Generate key pair
        const pair = await SEA.pair();
        const pairSerialized = JSON.stringify(pair); // Serialize the pair for storage

        // Encrypt the alias and password with the pair
        const encryptedAlias = await SEA.encrypt(alias, pair);
        const encryptedPass = await SEA.encrypt(pass, pair);

        // Store encrypted credentials and pair in localStorage
        localStorage.setItem("encryptedAlias", encryptedAlias);
        localStorage.setItem("encryptedPass", encryptedPass);
        localStorage.setItem("pair", pairSerialized);
      }
    });
  };

  const signIn = () => {
    user.auth(alias, pass, async (ack) => {
      if (ack.err) {
        console.error("Sign-in error:", ack.err);
        // Handle sign-in error
      } else {
        console.log("Sign-in successful:", ack);
        // Proceed with user session initialization

        // Update localStorage with the new encrypted username, password, and pair
        try {
          const pair = await SEA.pair();
          const encryptedAlias = await SEA.encrypt(alias, pair);
          const encryptedPass = await SEA.encrypt(pass, pair);
          const pairSerialized = JSON.stringify(pair);

          localStorage.setItem("encryptedAlias", encryptedAlias);
          localStorage.setItem("encryptedPass", encryptedPass);
          localStorage.setItem("pair", pairSerialized);

        } catch (error) {
          console.error("Error updating credentials:", error);
        }
      }
    });
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    showPassword = !showPassword;
    passwordInputType = showPassword ? "text" : "password";
  };

  // Function to handle input change for password field
  const handlePasswordInput = (event) => {
    pass = event.target.value;
  };

  // Prevent form submission default action
  const handleSubmit = (event) => {
    event.preventDefault();
    signIn();
  };
</script>

<h1>Login, Register, or Sync</h1>

<div>
  <h2>Welcome to Your Profile</h2>
  <p>
    Here you can sync your data across devices. If this is your first time, note down your
    automatically generated username and password. You can use these credentials to log in from
    another device to sync your data.
  </p>
  <p>
    If you are syncing your data, then paste below the username and password from your <em
      >initial</em
    > device. Then hit "Sign In".
  </p>
  <p>
    You can also create a new user with your own desired credentials. Simply write your desired
    username and password. Then hit "Sign Up". Now you can sign in with these new credentials across
    other devices too.
  </p>
  <hr />
  <div>
    <form on:submit|preventDefault={handleSubmit}>
      <label for="username">Username:</label>
      <input type="text" bind:value={alias} placeholder="Username" />
      <label for="password">Password:</label>
      <input
        type={passwordInputType}
        value={pass}
        on:input={handlePasswordInput}
        placeholder="Password"
      />
      <!-- Eye icon button for toggling password visibility -->
      <button type="button" class="eye-icon" on:click={togglePasswordVisibility}>
        {#if showPassword}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="red">
            <!-- SVG path for eye icon when password is visible -->
            <!-- Please replace this with the SVG path provided in your example -->
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <!-- SVG path for eye icon when password is hidden -->
            <!-- Please replace this with the SVG path provided in your example -->
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        {/if}
      </button>
      <br />
      <button type="submit">Sign In</button>
    </form>
  </div>
  <div>
    <button on:click={signUp}>Sign Up</button>
  </div>
  <!-- {#if message}
      <p>{message}</p>
    {/if} -->
</div>

<style>
  input {
    border: 1px solid gray;
  }

  input:focus {
    outline: none;
  }

  /* Add your CSS here */
  .eye-icon {
    position: relative;
    right: 5px;
    background-color: white;
    border: 1px solid gray;
    margin: 0;
  }

  .eye-icon svg {
    width: 14px;
    height: 14px;
    height: auto;
  }
</style>
