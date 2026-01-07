<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, type Project } from '$lib/api/client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = $derived(data.adminSession?.id);

	let event = $state<VoteEvent | null>(null);
	let projects = $state<Project[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(true);

	// New project form
	let showAddForm = $state(false);
	let newProjectName = $state('');
	let newProjectDescription = $state('');
	let isAddingProject = $state(false);

	// Edit project
	let editingProject = $state<Project | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let isSavingEdit = $state(false);

	// Delete
	let deletingProjectId = $state<string | null>(null);

	onMount(async () => {
		if (!sessionId) {
			return;
		}

		await loadData();
	});

	async function loadData() {
		if (!sessionId) return;

		isLoading = true;
		error = null;

		const [eventResponse, projectsResponse] = await Promise.all([
			adminApi.getEvent(sessionId, eventId),
			adminApi.getProjects(sessionId, eventId),
		]);

		isLoading = false;

		if (eventResponse.errors) {
			error = eventResponse.errors[0]?.message || 'Failed to load event';
			return;
		}

		if (projectsResponse.errors) {
			error = projectsResponse.errors[0]?.message || 'Failed to load projects';
		}

		event = eventResponse.data || null;
		projects = projectsResponse.data || [];
	}

	async function handleAddProject(evt: SubmitEvent) {
		evt.preventDefault();
		if (!sessionId || !newProjectName.trim()) return;

		isAddingProject = true;
		error = null;

		const response = await adminApi.createProject(sessionId, eventId, {
			name: newProjectName.trim(),
			description: newProjectDescription.trim() || undefined,
		});

		isAddingProject = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to create project';
			return;
		}

		if (response.data) {
			projects = [...projects, response.data];
			newProjectName = '';
			newProjectDescription = '';
			showAddForm = false;
		}
	}

	function startEdit(project: Project) {
		editingProject = project;
		editName = project.name;
		editDescription = project.description || '';
	}

	function cancelEdit() {
		editingProject = null;
		editName = '';
		editDescription = '';
	}

	async function saveEdit() {
		if (!sessionId || !editingProject || !editName.trim()) return;

		isSavingEdit = true;
		error = null;

		const response = await adminApi.updateProject(sessionId, eventId, editingProject.id, {
			name: editName.trim(),
			description: editDescription.trim() || undefined,
		});

		isSavingEdit = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to update project';
			return;
		}

		if (response.data) {
			projects = projects.map((p) => (p.id === response.data!.id ? response.data! : p));
			cancelEdit();
		}
	}

	async function deleteProject(projectId: string) {
		if (!sessionId) return;

		deletingProjectId = projectId;
		error = null;

		const response = await adminApi.deleteProject(sessionId, eventId, projectId);

		deletingProjectId = null;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to delete project';
			return;
		}

		projects = projects.filter((p) => p.id !== projectId);
	}
</script>

<div class="animate-fade-in">
	<div class="mb-8">
		<a href={urls.voteAdminEvent(eventId)} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
			</svg>
			Back to Event
		</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-4">
			{event?.name || 'Loading...'} - Projects
		</h1>
		<p class="text-gray-600 mt-1">Manage projects that voters can select</p>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else}
		<!-- Add project button/form -->
		<div class="mb-6">
			{#if showAddForm}
				<div class="bg-white shadow rounded-xl p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Project</h3>
					<form onsubmit={handleAddProject} class="space-y-4">
						<div>
							<label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">
								Project Name
							</label>
							<input
								type="text"
								id="project-name"
								bind:value={newProjectName}
								placeholder="e.g., Team Alpha's Project"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
								disabled={isAddingProject}
							/>
						</div>
						<div>
							<label for="project-description" class="block text-sm font-medium text-gray-700 mb-2">
								Description (optional)
							</label>
							<textarea
								id="project-description"
								bind:value={newProjectDescription}
								placeholder="Brief description of the project"
								rows="2"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
								disabled={isAddingProject}
							></textarea>
						</div>
						<div class="flex gap-3">
							<button
								type="submit"
								disabled={isAddingProject || !newProjectName.trim()}
								class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
							>
								{isAddingProject ? 'Adding...' : 'Add Project'}
							</button>
							<button
								type="button"
								onclick={() => { showAddForm = false; newProjectName = ''; newProjectDescription = ''; }}
								class="text-gray-600 hover:text-gray-900 py-2 px-4 transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => showAddForm = true}
					class="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Add Project
				</button>
			{/if}
		</div>

		<!-- Projects list -->
		{#if projects.length === 0}
			<div class="bg-white shadow rounded-xl p-12 text-center">
				<svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
				</svg>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
				<p class="text-gray-600">Add projects that voters can select.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each projects as project, index (project.id)}
					<div class="bg-white shadow rounded-xl p-6">
						{#if editingProject?.id === project.id}
							<!-- Edit mode -->
							<form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="space-y-4">
								<div>
									<input
										type="text"
										bind:value={editName}
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
										disabled={isSavingEdit}
									/>
								</div>
								<div>
									<textarea
										bind:value={editDescription}
										placeholder="Description (optional)"
										rows="2"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
										disabled={isSavingEdit}
									></textarea>
								</div>
								<div class="flex gap-3">
									<button
										type="submit"
										disabled={isSavingEdit || !editName.trim()}
										class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
									>
										{isSavingEdit ? 'Saving...' : 'Save'}
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										class="text-gray-600 hover:text-gray-900 py-2 px-4 transition-colors"
									>
										Cancel
									</button>
								</div>
							</form>
						{:else}
							<!-- Display mode -->
							<div class="flex items-start justify-between gap-4">
								<div class="flex-grow">
									<div class="flex items-center gap-3">
										<span class="text-gray-400 text-sm font-mono">#{index + 1}</span>
										<h3 class="text-lg font-semibold text-gray-900">{project.name}</h3>
									</div>
									{#if project.description}
										<p class="text-gray-600 mt-1 ml-8">{project.description}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => startEdit(project)}
										class="text-gray-600 hover:text-gray-900 p-2 transition-colors"
										title="Edit project"
										aria-label="Edit project {project.name}"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
										</svg>
									</button>
									<button
										type="button"
										onclick={() => deleteProject(project.id)}
										disabled={deletingProjectId === project.id}
										class="text-red-600 hover:text-red-700 p-2 transition-colors disabled:opacity-50"
										title="Delete project"
										aria-label="Delete project {project.name}"
									>
										{#if deletingProjectId === project.id}
											<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
												<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
												<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
											</svg>
										{:else}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
											</svg>
										{/if}
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
