<script lang="ts">
  /**
   * The error banner, everywhere.
   *
   * Thirteen verbatim copies of this markup were spread across the admin, login and vote
   * pages. Eleven of them — every copy under `/vote/admin` — carried no `role`, so an admin
   * on a screen reader got no indication that anything had failed: the banner is swapped in
   * by a form action's `fail(...)` without a navigation, focus stays on the submit button,
   * and nothing announces it. The page simply appeared not to respond.
   *
   * The two copies in the voter-facing flow did get `role="alert"` (ISS-787, #70); the admin
   * half was to be fixed by #71, which was closed rather than merged when ISS-788 reworked
   * the same pages server-side. This is that fix, arriving through the component instead, so
   * there is one copy left to forget about.
   */
  interface Props {
    message: string;
    /** Spacing and alignment for the surrounding layout — the only thing that varied. */
    class?: string;
  }

  let { message, class: className = '' }: Props = $props();
</script>

<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg {className}" role="alert">
  {message}
</div>
