<script lang="ts">
  import type { Snippet } from 'svelte';

  import Spinner from './Spinner.svelte';

  interface Props {
    href?: string;
    external?: boolean;
    onclick?: () => void;
    label?: string;
    /** `vote` is the yellow-400 / gray-900 action used across the voting app. */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'vote';
    size?: 'sm' | 'md' | 'lg';
    /** Only applies when rendered as a button; `submit` for a form's primary action. */
    type?: 'button' | 'submit';
    loading?: boolean;
    disabled?: boolean;
    testId?: string;
    fullWidth?: boolean;
    icon?: Snippet;
    children?: Snippet;
  }

  let {
    href,
    external = false,
    onclick,
    label,
    variant = 'primary',
    size = 'md',
    type = 'button',
    loading = false,
    disabled = false,
    testId,
    fullWidth = false,
    icon,
    children
  }: Props = $props();

  const baseClasses =
    'inline-flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-offset-2';

  /** The marketing variants share a raised, scaling look; `vote` is flat, bold and only recolours on hover. */
  const marketing = {
    extra: 'font-semibold shadow-md',
    hover: 'hover:scale-105 active:scale-100',
    inactive: 'cursor-not-allowed opacity-70'
  };

  const variantStyles = {
    primary: { ...marketing, colors: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-yellow-300' },
    secondary: { ...marketing, colors: 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500 disabled:bg-gray-400' },
    ghost: {
      ...marketing,
      colors: 'bg-transparent text-gray-700 hover:bg-gray-100 shadow-none focus:ring-gray-400 disabled:text-gray-400'
    },
    danger: { ...marketing, colors: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 disabled:bg-red-300' },
    vote: {
      extra: 'font-bold',
      hover: '',
      inactive: 'cursor-not-allowed opacity-50',
      colors: 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 focus:ring-yellow-400'
    }
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5'
  };

  const style = $derived(variantStyles[variant]);
  const inactive = $derived(disabled || loading);
  const widthClass = $derived(fullWidth ? 'w-full' : '');
  const stateClass = $derived(inactive ? style.inactive : `cursor-pointer ${style.hover}`);

  const buttonClasses = $derived(
    `${baseClasses} ${style.extra} ${style.colors} ${sizeClasses[size]} ${widthClass} ${stateClass}`.replace(/\s+/g, ' ').trim()
  );
</script>

{#if href && !disabled}
  <a
    {href}
    class={buttonClasses}
    data-testid={testId}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
  >
    {#if loading}
      <Spinner />
    {:else if icon}
      {@render icon()}
    {/if}
    {#if children}
      {@render children()}
    {:else if label}
      {label}
    {/if}
  </a>
{:else}
  <button class={buttonClasses} {onclick} disabled={inactive} {type} data-testid={testId}>
    {#if loading}
      <Spinner />
    {:else if icon}
      {@render icon()}
    {/if}
    {#if children}
      {@render children()}
    {:else if label}
      {label}
    {/if}
  </button>
{/if}
