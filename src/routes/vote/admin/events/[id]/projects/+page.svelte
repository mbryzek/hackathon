<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { Project } from '$lib/api/client';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const projects = $derived(data.projects);
  const error = $derived(form?.error ?? data.error);

  let showAddForm = $state(false);
  let isAddingProject = $state(false);

  /** The row being edited, and the rows with a save or a delete in flight. */
  let editingProjectId = $state<string | null>(null);
  let savingProjectId = $state<string | null>(null);
  let deletingProjectId = $state<string | null>(null);

  function startEdit(project: Project) {
    editingProjectId = project.id;
  }

  function cancelEdit() {
    editingProjectId = null;
  }
</script>

<div class="animate-fade-in">
  <EventAdminTabs {eventId} eventName={event?.name} activeTab="projects" />

  {#if error}
    <ErrorBanner {error} class="mb-6" />
  {/if}

  <!-- Add project button/form -->
  <div class="mb-6">
    {#if showAddForm}
      <div class="rounded-xl bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Add New Project</h3>
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            isAddingProject = true;
            return async ({ result, update }) => {
              await update();
              isAddingProject = false;
              if (result.type === 'success') showAddForm = false;
            };
          }}
          class="space-y-4"
        >
          <div>
            <label for="project-name" class="mb-2 block text-sm font-medium text-gray-700"> Project Name </label>
            <input
              type="text"
              id="project-name"
              name="name"
              placeholder="e.g., Team Alpha's Project"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              disabled={isAddingProject}
            />
          </div>
          <div>
            <label for="project-description" class="mb-2 block text-sm font-medium text-gray-700"> Description (optional) </label>
            <textarea
              id="project-description"
              name="description"
              placeholder="Brief description of the project"
              rows="2"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              disabled={isAddingProject}></textarea>
          </div>
          <div class="flex gap-3">
            <button
              type="submit"
              disabled={isAddingProject}
              class="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:opacity-50"
            >
              {isAddingProject ? 'Adding...' : 'Add Project'}
            </button>
            <button
              type="button"
              onclick={() => (showAddForm = false)}
              class="px-4 py-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    {:else}
      <div class="flex gap-3">
        <button
          type="button"
          onclick={() => (showAddForm = true)}
          class="inline-flex items-center rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500"
        >
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Project
        </button>
        <a
          href={urls.voteAdminEventProjectsBulk(eventId)}
          class="inline-flex items-center rounded-lg bg-gray-100 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-gray-200"
        >
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            ></path>
          </svg>
          Bulk Add
        </a>
      </div>
    {/if}
  </div>

  <!-- Projects list -->
  {#if projects.length === 0}
    <div class="rounded-xl bg-white p-12 text-center shadow">
      <svg class="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        ></path>
      </svg>
      <h3 class="mb-2 text-lg font-semibold text-gray-900">No projects yet</h3>
      <p class="text-gray-600">Add projects that voters can select.</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each projects as project, index (project.id)}
        <div class="rounded-xl bg-white p-6 shadow">
          {#if editingProjectId === project.id}
            <!-- Edit mode -->
            <form
              method="POST"
              action="?/update"
              use:enhance={() => {
                savingProjectId = project.id;
                return async ({ result, update }) => {
                  await update({ reset: false });
                  savingProjectId = null;
                  if (result.type === 'success') editingProjectId = null;
                };
              }}
              class="space-y-4"
            >
              <input type="hidden" name="id" value={project.id} />
              <div>
                <input
                  type="text"
                  name="name"
                  value={project.name}
                  aria-label="Project name"
                  class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  disabled={savingProjectId === project.id}
                />
              </div>
              <div>
                <textarea
                  name="description"
                  value={project.description ?? ''}
                  placeholder="Description (optional)"
                  aria-label="Project description"
                  rows="2"
                  class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  disabled={savingProjectId === project.id}></textarea>
              </div>
              <div class="flex gap-3">
                <button
                  type="submit"
                  disabled={savingProjectId === project.id}
                  class="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                >
                  {savingProjectId === project.id ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onclick={cancelEdit} class="px-4 py-2 text-gray-600 transition-colors hover:text-gray-900">
                  Cancel
                </button>
              </div>
            </form>
          {:else}
            <!-- Display mode -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-grow">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-sm text-gray-400">#{index + 1}</span>
                  <h3 class="text-lg font-semibold text-gray-900">{project.name}</h3>
                </div>
                {#if project.description}
                  <p class="ml-8 mt-1 text-gray-600">{project.description}</p>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => startEdit(project)}
                  class="p-2 text-gray-600 transition-colors hover:text-gray-900"
                  title="Edit project"
                  aria-label="Edit project {project.name}"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </button>
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    deletingProjectId = project.id;
                    return async ({ update }) => {
                      await update();
                      deletingProjectId = null;
                    };
                  }}
                >
                  <input type="hidden" name="id" value={project.id} />
                  <button
                    type="submit"
                    disabled={deletingProjectId === project.id}
                    class="p-2 text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                    title="Delete project"
                    aria-label="Delete project {project.name}"
                  >
                    {#if deletingProjectId === project.id}
                      <Spinner />
                    {:else}
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    {/if}
                  </button>
                </form>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
