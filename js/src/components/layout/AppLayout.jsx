import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAuth } from '../../auth/useAuth'
import { useWorkspace } from '../../workspaces/useWorkspace'
import { useI18n } from '../../i18n/useI18n'
import { Select, IconButton, LanguageSwitcher } from '../ui'
import {
  MenuIcon,
  WorkspacesIcon,
  GroupIcon,
  HistoryIcon,
  LogoutIcon,
  UserCircleIcon,
} from '../icons'

function buildNavItems(workspaceId, t) {
  const workspacePath = workspaceId ? `/app/workspaces/${workspaceId}` : '/app/workspaces'

  return [
    {
      key: 'workspaces',
      label: t('workspace.menu_workspaces'),
      icon: <WorkspacesIcon size={18} />,
      to: '/app/workspaces',
      exact: true,
    },
    {
      key: 'members',
      label: t('workspace.menu_members'),
      icon: <GroupIcon size={18} />,
      to: `${workspacePath}/members`,
    },
    {
      key: 'audit',
      label: t('workspace.menu_audit'),
      icon: <HistoryIcon size={18} />,
      to: `${workspacePath}/audit`,
    },
  ]
}

function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.to
  return pathname.startsWith(item.to)
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { workspaces, currentWorkspaceId, setCurrentWorkspaceId } = useWorkspace()

  const navItems = useMemo(
    () => buildNavItems(currentWorkspaceId, t),
    [currentWorkspaceId, t],
  )

  const handleWorkspaceChange = (val) => {
    const workspaceId = Number(val)
    setCurrentWorkspaceId(workspaceId)

    const isWorkspaceScopedPage =
      location.pathname.includes('/members') ||
      location.pathname.includes('/audit')

    if (isWorkspaceScopedPage) {
      navigate(`/app/workspaces/${workspaceId}/members`)
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-5">
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
          {t('app.name')}
        </span>
        <p className="mt-1 text-sm text-text-secondary">{t('workspace.sidebar_subtitle')}</p>
      </div>

      <div className="px-5 pb-4">
        <span className="mb-1.5 block text-xs text-text-secondary">
          {t('workspace.switcher_label')}
        </span>
        <Select
          fullWidth
          size="sm"
          value={currentWorkspaceId ?? ''}
          onChange={handleWorkspaceChange}
          options={
            workspaces.length === 0
              ? [{ value: '', label: t('workspace.no_workspaces_short'), disabled: true }]
              : workspaces.map((ws) => ({ value: ws.id, label: ws.name }))
          }
        />
      </div>

      <hr className="border-divider/60" />

      <nav className="flex-1 px-3 py-3">
        {navItems.map((item) => {
          const active = isNavItemActive(location.pathname, item)
          const disabled = !currentWorkspaceId && item.key !== 'workspaces'

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 mb-1 text-sm rounded-md transition-all duration-150',
                active
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-primary hover:bg-gray-100 font-medium',
                disabled && 'opacity-40 pointer-events-none',
              )}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <hr className="border-divider/60" />

      <div className="p-5">
        <span className="text-xs text-text-secondary">{t('workspace.signed_as')}</span>
        <p className="mt-1 text-sm font-semibold break-words">{user?.email}</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[280px] bg-surface border-r border-divider/60 shadow-lg transform transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — desktop */}
      <aside className="hidden md:block md:w-[280px] md:shrink-0 border-r border-divider/60 bg-surface">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[66px] items-center border-b border-divider/60 bg-surface/80 backdrop-blur-sm px-4">
          <button
            className="mr-3 md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <MenuIcon size={24} />
          </button>

          <h2 className="flex-1 text-lg font-bold">{t('workspace.admin_title')}</h2>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
            <IconButton
              onClick={() => navigate('/app/profile')}
              title={t('common.profile') || 'Profile'}
            >
              <UserCircleIcon size={20} />
            </IconButton>
            <IconButton onClick={logout} title={t('common.logout')}>
              <LogoutIcon size={20} />
            </IconButton>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
