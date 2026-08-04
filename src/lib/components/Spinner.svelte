<script lang="ts">
  interface Props {
    /** sm = 1.25rem, md = 1.5rem, lg = 2rem. */
    size?: 'sm' | 'md' | 'lg';
    /**
     * Accessible name, for a spinner that is the only indication that something is
     * loading. Omit it when adjacent text already says so — the spinner is then
     * decorative and is hidden from assistive technology.
     */
    label?: string;
    /** Extra classes, typically colour (the arc inherits currentColor) or margins. */
    class?: string;
  }

  let { size = 'sm', label, class: className = '' }: Props = $props();

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const classes = $derived(`animate-spin ${sizeClasses[size]} ${className}`.trimEnd());
</script>

<svg
  class={classes}
  viewBox="0 0 24 24"
  fill="none"
  role={label ? 'status' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : true}
>
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path
    class="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  ></path>
</svg>
