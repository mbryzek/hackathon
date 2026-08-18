import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dataOr } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { optionalText, trimmed } from '$lib/server/fields';

export const load: PageServerLoad = async (event) => {
  const sessionId = requireSessionId(event);
  const [eventResponse, projectsResponse] = await Promise.all([
    adminApi.getEvent(sessionId, event.params.id),
    adminApi.getProjects(sessionId, event.params.id)
  ]);

  return {
    event: dataOr(eventResponse, null),
    projects: dataOr(projectsResponse, []),
    error: firstError(event, [eventResponse, projectsResponse], 'Event not found')
  };
};

/** The name/description every project form submits, plus the row an edit or a delete names. */
async function projectForm(request: Request): Promise<{ id: string; name: string; description?: string }> {
  const form = await request.formData();
  return {
    id: trimmed(form.get('id')),
    name: trimmed(form.get('name')),
    description: optionalText(form.get('description'))
  };
}

export const actions = {
  create: async (event) => {
    const { name, description } = await projectForm(event.request);
    if (!name) {
      return fail(400, { error: 'Please enter a project name' });
    }

    const response = await adminApi.createProject(requireSessionId(event), event.params.id, { name, description });
    const error = firstError(event, [response]);

    return error === null ? undefined : fail(response.status, { error });
  },

  update: async (event) => {
    const { id, name, description } = await projectForm(event.request);
    if (!name) {
      return fail(400, { error: 'Please enter a project name' });
    }

    const response = await adminApi.updateProject(requireSessionId(event), event.params.id, id, { name, description });
    const error = firstError(event, [response], 'Project not found');

    return error === null ? undefined : fail(response.status, { error });
  },

  delete: async (event) => {
    const { id } = await projectForm(event.request);

    const response = await adminApi.deleteProject(requireSessionId(event), event.params.id, id);
    const error = firstError(event, [response], 'Project not found');

    return error === null ? undefined : fail(response.status, { error });
  }
} satisfies Actions;
