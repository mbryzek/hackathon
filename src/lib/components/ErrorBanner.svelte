<script lang="ts">
  /**
   * The admin error banner. Eleven verbatim copies of this markup were spread across the admin
   * and login pages; none of them announced anything, so an admin on a screen reader got no
   * indication that an action had failed. `role="alert"` here fixes that everywhere at once.
   */
  interface Props {
    message: string;
    /** Spacing for the surrounding layout — the only thing that varied between the copies. */
    class?: string;
  }

  let { message, class: className = '' }: Props = $props();
</script>

<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg {className}" role="alert">
  {message}
</div>
