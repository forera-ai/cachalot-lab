import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { DiveScreen } from './ManagedScreens'
import { newProfile, type LaunchProfile, type ManagedRuntime } from './managed'
import type { RuntimeConnection } from './runtime'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ invoke, isTauri: () => true }))

const managed = { status: null, error: null, working: false } as ManagedRuntime
const runtime = { snapshot: { endpoint: null } } as RuntimeConnection
let profiles: LaunchProfile[]

beforeEach(() => {
  profiles = []
  invoke
    .mockReset()
    .mockImplementation(
      async (command: string, args?: { profile: LaunchProfile }) => {
        if (command === 'list_profiles') return profiles
        if (command === 'read_managed_log') return ''
        if (command === 'save_profile' && args) profiles = [args.profile]
      },
    )
})

it('saves, reopens, and clears optional GLM controls when family changes', async () => {
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(screen.getByRole('button', { name: 'New profile' }))
  await user.type(screen.getByLabelText('Profile name'), 'GLM test')
  await user.type(screen.getByLabelText('Python executable'), '/python')
  await user.type(screen.getByLabelText('Model directory'), '/model')
  await user.selectOptions(screen.getByLabelText('Model family'), 'glm')
  const bank = screen.getByLabelText(/GLM expert bank directory/)
  const enabled = screen.getByLabelText(/GLM expert bank ·/)
  const topk = screen.getByLabelText(/GLM prefetch experts/)
  const limit = screen.getByLabelText(/GLM prefetch read limit/)
  const scheduling = screen.getByLabelText(/GLM prefetch scheduling/)
  expect(topk).toHaveValue(null)
  expect(enabled).toHaveValue('inherit')
  await user.type(bank, '/models/GLM bank')
  await user.selectOptions(enabled, 'false')
  await user.type(topk, '0')
  await user.type(limit, '3')
  await user.selectOptions(scheduling, '-1')
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith('save_profile', {
      profile: expect.objectContaining({
        family: 'glm',
        tuning: expect.objectContaining({
          glm_bank_path: '/models/GLM bank',
          glm_bank_enabled: false,
          glm_predict_topk: 0,
          glm_predict_limit: 3,
          glm_predict_after_demand: -1,
        }),
      }),
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  expect(screen.getByLabelText(/GLM prefetch experts/)).toHaveValue(0)
  expect(screen.getByLabelText(/GLM prefetch scheduling/)).toHaveValue('-1')
  await user.selectOptions(screen.getByLabelText('Model family'), 'minimax')
  expect(
    screen.queryByLabelText(/GLM prefetch experts/),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  expect(profiles[0]?.tuning.glm_bank_path).toBeNull()
  expect(profiles[0]?.tuning.glm_bank_enabled).toBeNull()
  expect(profiles[0]?.tuning.glm_predict_topk).toBeNull()
})

it('keeps omitted fields empty when editing an older GLM profile', async () => {
  const profile = newProfile()
  profile.name = 'Older GLM'
  profile.family = 'glm'
  for (const key of Object.keys(profile.tuning).filter((key) =>
    key.startsWith('glm_'),
  )) {
    delete (profile.tuning as unknown as Record<string, unknown>)[key]
  }
  profiles = [profile]
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(await screen.findByRole('button', { name: 'Edit' }))
  expect(screen.getByLabelText(/GLM expert bank directory/)).toHaveValue('')
  expect(screen.getByLabelText(/GLM expert bank ·/)).toHaveValue('inherit')
  expect(screen.getByLabelText(/GLM prefetch experts/)).toHaveValue(null)
  expect(screen.getByLabelText(/GLM prefetch read limit/)).toHaveValue(null)
  expect(screen.getByLabelText(/GLM prefetch scheduling/)).toHaveValue(
    'inherit',
  )
})

it('saves DeepSeek choices, preserves inherited defaults, and clears family-specific controls', async () => {
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(screen.getByRole('button', { name: 'New profile' }))
  await user.type(screen.getByLabelText('Profile name'), 'DeepSeek test')
  await user.type(screen.getByLabelText('Python executable'), '/python')
  await user.type(screen.getByLabelText('Model directory'), '/model')
  await user.selectOptions(screen.getByLabelText('Model family'), 'deepseek')
  const drops = screen.getByLabelText(/Decode drops misses/)
  const dates = screen.getByLabelText(/System date reuse/)
  expect(drops).toHaveValue('inherit')
  expect(dates).toHaveValue('inherit')
  expect(
    screen.getByText(/model can see a date up to 7 days old/),
  ).toBeInTheDocument()
  await user.selectOptions(drops, 'true')
  await user.selectOptions(dates, 'false')
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() =>
    expect(profiles[0]?.tuning.deepseek_decode_drop_misses).toBe(true),
  )
  expect(profiles[0]?.tuning.deepseek_system_date_reuse).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  expect(screen.getByLabelText(/Decode drops misses/)).toHaveValue('true')
  expect(screen.getByLabelText(/System date reuse/)).toHaveValue('false')
  await user.selectOptions(
    screen.getByLabelText(/Decode drops misses/),
    'false',
  )
  await user.selectOptions(screen.getByLabelText(/System date reuse/), 'true')
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() =>
    expect(profiles[0]?.tuning.deepseek_decode_drop_misses).toBe(false),
  )
  expect(profiles[0]?.tuning.deepseek_system_date_reuse).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  await user.selectOptions(screen.getByLabelText('Model family'), 'glm')
  expect(screen.queryByLabelText(/Decode drops misses/)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() => expect(profiles[0]?.family).toBe('glm'))
  expect(profiles[0]?.tuning.deepseek_decode_drop_misses).toBeNull()
  expect(profiles[0]?.tuning.deepseek_system_date_reuse).toBeNull()
})

it('keeps older DeepSeek profiles on inherited CLI defaults', async () => {
  const profile = newProfile()
  profile.name = 'Older DeepSeek'
  profile.family = 'deepseek'
  delete (profile.tuning as unknown as Record<string, unknown>)
    .deepseek_decode_drop_misses
  delete (profile.tuning as unknown as Record<string, unknown>)
    .deepseek_system_date_reuse
  profiles = [profile]
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(await screen.findByRole('button', { name: 'Edit' }))
  expect(screen.getByLabelText(/Decode drops misses/)).toHaveValue('inherit')
  expect(screen.getByLabelText(/System date reuse/)).toHaveValue('inherit')
})

it('discovers a model into an unsaved draft without launching it', async () => {
  const original = invoke.getMockImplementation()!
  invoke.mockImplementation(async (command, args) =>
    command === 'discover_models'
      ? {
          root: '/models',
          models: [
            {
              name: 'GLM local',
              path: '/models/glm',
              family: 'glm',
              model_type: 'glm5_next',
              weights_present: false,
              tokenizer_present: true,
            },
          ],
          scanned_dirs: 2,
          skipped_dirs: 0,
          invalid_configs: 0,
          truncated: false,
        }
      : original(command, args),
  )
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.type(screen.getByLabelText('Search folder'), '/models')
  await user.click(screen.getByRole('button', { name: 'Scan folder' }))
  expect(
    await screen.findByText('No weight file found', { exact: false }),
  ).toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: 'Create profile for GLM local' }),
  )
  expect(screen.getByLabelText('Model directory')).toHaveValue('/models/glm')
  expect(screen.getByLabelText('Model family')).toHaveValue('glm')
  expect(screen.getByLabelText('Python executable')).toHaveValue('')
  expect(
    invoke.mock.calls.some(
      ([command]) =>
        command === 'save_profile' || command === 'start_managed_runtime',
    ),
  ).toBe(false)
})

it('separates deletion from launch actions and requires explicit confirmation', async () => {
  profiles = [{ ...newProfile(), name: 'Disposable test profile' }]
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(
    await screen.findByRole('button', { name: 'Delete profile' }),
  )
  expect(
    screen.getByRole('group', { name: 'Delete profile confirmation' }),
  ).toBeInTheDocument()
  expect(
    invoke.mock.calls.some(([command]) => command === 'delete_profile'),
  ).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Keep profile' }))
  expect(
    screen.queryByRole('group', { name: 'Delete profile confirmation' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Delete profile' }))
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith('delete_profile', {
      id: profiles[0]?.id,
    }),
  )
})

it('shows a labeled launch preview and can dismiss it', async () => {
  profiles = [{ ...newProfile(), name: 'Preview test' }]
  const original = invoke.getMockImplementation()!
  invoke.mockImplementation(async (command, args) =>
    command === 'preview_profile'
      ? {
          executable: '/python',
          args: ['-m', 'cachalot.cli', '--model', '/models/a b'],
          environment: { CACHALOT_TEST: '0' },
          endpoint: 'http://127.0.0.1:8011',
        }
      : original(command, args),
  )
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(await screen.findByRole('button', { name: 'Preview' }))
  const preview = await screen.findByRole('region', { name: 'Launch preview' })
  expect(preview).toHaveTextContent('Executable')
  expect(preview).toHaveTextContent('Environment overrides')
  expect(preview).toHaveTextContent('CACHALOT_TEST=0')
  expect(preview).toHaveTextContent('"/models/a b"')
  await user.click(screen.getByRole('button', { name: 'Hide preview' }))
  expect(
    screen.queryByRole('region', { name: 'Launch preview' }),
  ).not.toBeInTheDocument()
})

it('does not offer to stop another selected profile runtime', async () => {
  profiles = [{ ...newProfile(), name: 'Inactive profile' }]
  const active = {
    ...managed,
    status: {
      running: true,
      ready: true,
      profile_id: 'another-profile',
      endpoint: 'http://127.0.0.1:8012',
      pid: 42,
      last_exit_code: null,
    },
  }
  render(<DiveScreen managed={active} runtime={runtime} />)
  expect(
    await screen.findByRole('button', { name: 'Start runtime' }),
  ).toBeDisabled()
  expect(
    screen.queryByRole('button', { name: 'Stop runtime' }),
  ).not.toBeInTheDocument()
  expect(screen.getByText(/Another profile is running/)).toBeInTheDocument()
})

it('discards a late preview after selecting another profile', async () => {
  profiles = [
    { ...newProfile(), name: 'First' },
    { ...newProfile(), name: 'Second' },
  ]
  let resolvePreview!: (value: unknown) => void
  const original = invoke.getMockImplementation()!
  invoke.mockImplementation(async (command, args) =>
    command === 'preview_profile'
      ? new Promise((resolve) => {
          resolvePreview = resolve
        })
      : original(command, args),
  )
  const user = userEvent.setup()
  render(<DiveScreen managed={managed} runtime={runtime} />)
  await user.click(await screen.findByRole('button', { name: 'Preview' }))
  await user.click(screen.getByRole('button', { name: /Second.*auto/ }))
  resolvePreview({
    executable: '/old-python',
    args: [],
    environment: {},
    endpoint: 'http://127.0.0.1:8011',
  })
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument(),
  )
  expect(
    screen.queryByRole('region', { name: 'Launch preview' }),
  ).not.toBeInTheDocument()
})
